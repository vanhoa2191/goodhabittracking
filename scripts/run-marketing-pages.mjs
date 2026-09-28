import { spawn } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const executable = join(projectRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler');
const [command, ...forwardedArgs] = process.argv.slice(2);

if (command !== 'deploy') {
  throw new Error('Expected marketing Pages command: deploy.');
}

const stagingRoot = await mkdtemp(join(tmpdir(), 'kidhabit-pages-'));
const stagingArtifact = join(stagingRoot, 'marketing');
await cp(join(projectRoot, 'dist', 'marketing'), stagingArtifact, { recursive: true });
const childEnv = { ...process.env };
delete childEnv.INIT_CWD;
delete childEnv.npm_config_local_prefix;
childEnv.PWD = stagingRoot;

const args = ['pages', command, stagingArtifact];
args.push('--project-name', 'kidhabit-home');
args.push(...forwardedArgs);

const child = spawn(executable, args, {
  cwd: stagingRoot,
  env: childEnv,
  stdio: 'inherit',
});

async function cleanup() {
  await rm(stagingRoot, { recursive: true, force: true });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => child.kill(signal));
}

child.once('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  void cleanup();
  process.exitCode = 1;
});

child.once('exit', async (code, signal) => {
  await cleanup();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
