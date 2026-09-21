import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import {
  prepareCloudflareBuildEnvironment,
  serverOnlyNames,
} from './cloudflare-build-environment.mjs';
const supportedModes = new Set(['build', 'preview', 'deploy']);
const mode = process.argv[2];

if (!supportedModes.has(mode)) {
  process.stderr.write('Usage: node scripts/run-cloudflare.mjs <build|preview|deploy>\n');
  process.exit(1);
}

if (existsSync('.env.local')) {
  const localEnvironment = readFileSync('.env.local', 'utf8');
  const unsafeNames = serverOnlyNames.filter((name) => {
    const match = localEnvironment.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return Boolean(match?.[1]?.trim());
  });
  if (unsafeNames.length > 0) {
    process.stderr.write(
      `Cloudflare build blocked: remove server-only values from .env.local (${unsafeNames.join(', ')}).\n`,
    );
    process.exit(1);
  }
}

function runOpenNext(command, environment) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['opennextjs-cloudflare', command], {
      env: environment,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`OpenNext ${command} exited with ${signal ?? code}.`));
    });
  });
}

try {
  const buildEnvironment = prepareCloudflareBuildEnvironment(process.env, mode);
  await runOpenNext('build', buildEnvironment);
  if (mode !== 'build') await runOpenNext(mode, process.env);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Cloudflare command failed.'}\n`);
  process.exit(1);
}
