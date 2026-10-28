import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const port = 8798;
const origin = `http://127.0.0.1:${port}`;
let child;
let exited;
let interrupted = false;
let runtimeDirectory;

function interrupt() {
  interrupted = true;
}

function signalWorker(signal) {
  if (!child?.pid) return;
  try {
    // Wrangler launches workerd children; stop only this check's process group.
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

async function main() {
  if (process.platform === 'win32') throw new Error('This runtime gate requires a POSIX runner for process-group cleanup.');
  if (!existsSync('.open-next/worker.js')) throw new Error('Build the Cloudflare Worker before checking its runtime.');
  // Wrangler prefers this legacy location over XDG_CONFIG_HOME when it exists.
  if (existsSync(join(homedir(), '.wrangler'))) {
    throw new Error('Legacy Wrangler configuration would bypass credential isolation; use a clean runner.');
  }
  await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Runtime-check port ${port} is already in use.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolvePort));
  });

  runtimeDirectory = mkdtempSync(join(tmpdir(), 'kidhabit-worker-runtime-'));
  const emptyEnvironment = join(runtimeDirectory, 'empty.env');
  writeFileSync(emptyEnvironment, '');
  const environment = {
    PATH: process.env.PATH,
    CI: 'true',
    XDG_CONFIG_HOME: join(runtimeDirectory, 'config'),
    XDG_CACHE_HOME: join(runtimeDirectory, 'cache'),
    WRANGLER_SEND_METRICS: 'false',
    WRANGLER_LOG_PATH: join(runtimeDirectory, 'wrangler.log'),
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false',
  };
  child = spawn(process.execPath, [
    resolve('node_modules/wrangler/bin/wrangler.js'), 'dev',
    '--config', resolve('wrangler.jsonc'), '--local', '--ip', '127.0.0.1',
    '--port', String(port), '--inspector-port', '0',
    '--var', 'ENABLE_THINKING_GAMES:true',
    // Explicit env-file skips .dev.vars; dotenv loading and inherited secrets are disabled too.
    '--env-file', emptyEnvironment, '--persist-to', join(runtimeDirectory, 'state'),
    '--show-interactive-dev-session=false', '--log-level', 'error',
  ], { env: environment, detached: true, stdio: 'ignore' });
  let spawnFailed = false;
  child.once('error', () => { spawnFailed = true; });
  exited = new Promise((resolveExit) => child.once('exit', resolveExit));

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error('Runtime check interrupted.');
    if (spawnFailed || child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Local Wrangler exited before the runtime check completed.');
    }
    let response;
    try {
      response = await fetch(`${origin}/api/health`, { redirect: 'manual', signal: AbortSignal.timeout(2_000) });
    } catch {
      await delay(250);
      continue;
    }
    if (![200, 503].includes(response.status)) {
      throw new Error(`Worker /api/health returned HTTP ${response.status}; its runtime did not initialize correctly.`);
    }
    let health;
    try { health = await response.json(); } catch {
      throw new Error('Worker /api/health did not return application health JSON.');
    }
    const validStatus = response.status === 200
      ? health?.status === 'ready'
      : ['degraded', 'unavailable'].includes(health?.status);
    if (!validStatus || typeof health?.version !== 'string' || !health.version) {
      throw new Error('Worker returned an invalid application health response.');
    }
    // A valid unauthenticated start must get past the approved catalog and
    // stop at session authentication, without touching the database.
    const catalogStart = performance.now();
    const start = await fetch(`${origin}/api/child/thinking-games/start`, {
      method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15_000),
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({ slot: 'main', expectedLocalDay: '2026-10-23', commandId: '00000000-0000-4000-8000-000000000001' }),
    });
    const startBody = await start.json().catch(() => null);
    if (start.status !== 401 || startBody?.code !== 'session_invalid') {
      throw new Error(`Bundled release catalog was not admitted (HTTP ${start.status}, code ${startBody?.code ?? 'invalid_json'}).`);
    }
    const catalogFirstRequestMs = Math.round(performance.now() - catalogStart);
    if (catalogFirstRequestMs > 1000) {
      throw new Error(`Catalog cold request exceeded the local 1000ms budget (${catalogFirstRequestMs}ms).`);
    }
    process.stdout.write(`${JSON.stringify({
      status: 'passed', scope: 'local-worker-bootstrap',
      healthStatus: health.status, httpStatus: response.status,
      approvedCatalog: 'admitted', sessionBoundary: 'enforced',
      catalogFirstRequestMs,
      productionReadiness: 'not-verified',
    })}\n`);
    return;
  }
  throw new Error('Local Worker did not answer /api/health within 60 seconds.');
}

process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
  await main();
} catch (error) {
  process.stderr.write(`Cloudflare runtime check failed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  signalWorker('SIGTERM');
  if (exited) await Promise.race([exited, delay(3_000)]);
  signalWorker('SIGKILL');
  if (runtimeDirectory) rmSync(runtimeDirectory, { recursive: true, force: true });
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}
