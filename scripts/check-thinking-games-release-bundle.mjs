import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(new URL('..', import.meta.url).pathname);
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Value required for ${name}.`);
  return resolve(args[index + 1]);
};
let temporary;
try {
  const manifestPath = option('--manifest', join(root, 'content/thinking-games/manifests/release-365-v1.json'));
  const proofPath = option('--proof', join(root, 'content/thinking-games/manifests/release-365-v1.validation.json'));
  const pinSource = readFileSync(join(root, 'src/lib/thinking-games/server/release-manifest.ts'), 'utf8');
  const trustedDigest = pinSource.match(/export const RELEASE_MANIFEST_DIGEST = '([a-f0-9]{64})'/)?.[1];
  const trustedVersion = pinSource.match(/export const RELEASE_MANIFEST_VERSION = '([^']+)'/)?.[1];
  const raw = readFileSync(manifestPath, 'utf8');
  const digest = createHash('sha256').update(raw).digest('hex');
  if (!trustedDigest || digest !== trustedDigest) throw new Error('Release bundle digest does not match the reviewed pin.');
  const manifest = JSON.parse(raw);
  if (manifest.manifestVersion !== trustedVersion) throw new Error('Release bundle version does not match the reviewed version.');
  const proof = {
    schemaVersion: 1,
    validationProfile: 'release',
    manifestVersion: trustedVersion,
    manifestDigest: digest,
    itemCount: manifest.items?.length,
  };
  if (!args.includes('--write-proof')
    && JSON.stringify(JSON.parse(readFileSync(proofPath, 'utf8'))) !== JSON.stringify(proof)) {
    throw new Error('Release validation proof is stale or invalid.');
  }
  temporary = mkdtempSync(join(tmpdir(), 'thinking-games-release-proof-'));
  const outfile = join(temporary, 'validator.mjs');
  await build({
    entryPoints: [join(root, 'src/lib/thinking-games/manifest.ts')],
    bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent',
  });
  const { validateManifest } = await import(pathToFileURL(outfile).href);
  const validation = validateManifest(manifest, { profile: 'release' });
  if (!validation.ok) throw new Error('Release bundle failed complete release-profile validation.');
  if (args.includes('--write-proof')) writeFileSync(proofPath, `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'passed', ...proof, completeReleaseValidation: true }));
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Release bundle verification failed.');
  process.exitCode = 1;
} finally {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
}
