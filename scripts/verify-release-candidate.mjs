import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';

const PORT = 3420;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const allowDirty = process.argv.includes('--allow-dirty');
const preflightOnly = process.argv.includes('--preflight-only');
const fingerprints = JSON.parse(
  readFileSync(new URL('../config/compromised-credential-fingerprints.json', import.meta.url), 'utf8'),
).payosSha256;

function fail(message) {
  process.stderr.write(`Release preflight failed: ${message}\n`);
  process.exit(1);
}

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) fail(`${name} is required.`);
  return value;
}

function fingerprint(value) {
  return createHash('sha256').update(value).digest('hex');
}

function run(command, args, environment = process.env) {
  const result = spawn(command, args, { env: environment, stdio: 'inherit' });
  return new Promise((resolve, reject) => {
    result.once('error', reject);
    result.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${signal ?? code}.`));
    });
  });
}

async function assertPortAvailable() {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${PORT} is already in use.`)));
    server.listen(PORT, '127.0.0.1', () => server.close(resolve));
  });
}

async function waitForReady(serverProcess) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) throw new Error('Production server exited before readiness.');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      const body = await response.json();
      if (response.ok && body.status === 'ready') return body;
      if (allowDirty && body.checks?.app === true) return body;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Production health endpoint did not become ready within 60 seconds.');
}

function runPreflight() {
  const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
  if (status && !allowDirty) fail('the worktree is dirty. Commit the release candidate first.');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const expectedSha = requireValue('RELEASE_SHA');
  if (head !== expectedSha) fail('RELEASE_SHA does not match the current commit.');

  const appUrl = requireValue('NEXT_PUBLIC_APP_URL');
  try {
    if (new URL(appUrl).protocol !== 'https:') fail('NEXT_PUBLIC_APP_URL must use HTTPS.');
  } catch {
    fail('NEXT_PUBLIC_APP_URL must be a valid URL.');
  }
  for (const name of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]) requireValue(name);
  const pairingSecret = requireValue('PAIRING_RATE_LIMIT_SECRET');
  if (pairingSecret.length < 32) fail('PAIRING_RATE_LIMIT_SECRET must contain at least 32 characters.');
  if (process.env.ENABLE_PAYMENT_SIMULATION !== 'false') fail('ENABLE_PAYMENT_SIMULATION must be false.');
  if (process.env.ENABLE_LEGACY_PAIRING !== 'false') fail('ENABLE_LEGACY_PAIRING must be false.');

  for (const name of ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY']) {
    const value = requireValue(name);
    if (fingerprints.includes(fingerprint(value))) fail('PayOS credential rotation is required.');
  }
  return head;
}

let serverProcess;
try {
  const releaseSha = runPreflight();
  const candidateLabel = allowDirty
    ? `Working tree based on ${releaseSha}`
    : `Release candidate ${releaseSha}`;
  process.stdout.write(`${candidateLabel} passed preflight.\n`);
  if (preflightOnly) process.exit(0);

  await run('npm', ['run', 'ci']);
  await assertPortAvailable();
  serverProcess = spawn('npm', ['run', 'start'], {
    env: { ...process.env, PORT: String(PORT) },
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const health = await waitForReady(serverProcess);
  if (allowDirty && health.status !== 'ready') {
    process.stdout.write('Local working-tree verification is using configuration-only health; strict release candidates require live dependency readiness.\n');
  }
  if (health.version !== 'local' && !releaseSha.startsWith(health.version)) {
    throw new Error('Runtime version does not match the release candidate commit.');
  }
  await run('npx', ['playwright', 'test'], {
    ...process.env,
    PLAYWRIGHT_BASE_URL: BASE_URL,
  });
  process.stdout.write(`${candidateLabel} passed all local certification gates.\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Release verification failed.'}\n`);
  process.exitCode = 1;
} finally {
  if (serverProcess?.pid && serverProcess.exitCode === null) {
    process.kill(-serverProcess.pid, 'SIGTERM');
    await new Promise((resolve) => serverProcess.once('exit', resolve));
  }
}
