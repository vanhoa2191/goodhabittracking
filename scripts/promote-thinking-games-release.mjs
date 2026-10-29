#!/usr/bin/env node
/**
 * promote-thinking-games-release.mjs
 *
 * PREPARATION-ONLY promotion tool.  Validates a reviewed candidate manifest,
 * verifies the human review proof (approval-hash + editorial-signature), and
 * writes a reviewable LOCAL import artifact.  It does NOT:
 *   - write to content/thinking-games/manifests/release-365-v2.json
 *   - apply changes to any real database
 *   - alter existing release manifests
 *
 * The output artifact is written to:
 *   content/thinking-games/manifests/<version>.approved.json
 *
 * and must be reviewed before a separate operator step promotes it to the
 * serving path.  The on-disk release-365-v2.json is never modified by this tool.
 *
 * Usage:
 *   node scripts/promote-thinking-games-release.mjs \
 *     --manifest <path-to-candidate-manifest> \
 *     --approval-hash <sha256-of-manifest-content> \
 *     --editorial-signature <human-signature-blob>
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

const root = resolve(new URL('..', import.meta.url).pathname);

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith('--manifest=')) result.manifest = arg.slice(11);
    else if (arg === '--manifest') result.manifest = args[++i];
    else if (arg.startsWith('--approval-hash=')) result.approvalHash = arg.slice(16);
    else if (arg === '--approval-hash') result.approvalHash = args[++i];
    else if (arg.startsWith('--editorial-signature=')) result.editorialSignature = arg.slice(23);
    else if (arg === '--editorial-signature') result.editorialSignature = args[++i];
    else if (arg.startsWith('--output=')) result.output = arg.slice(9);
    else if (arg === '--output') result.output = args[++i];
  }
  return result;
}

const args = parseArgs(process.argv.slice(2));

if (!args.manifest || !args.approvalHash || !args.editorialSignature) {
  console.error('Usage: promote-thinking-games-release.mjs --manifest <path> --approval-hash <sha256> --editorial-signature <blob>');
  process.exit(1);
}

// Compute the SHA-256 of the raw manifest file (content binding).
const manifestRaw = readFileSync(args.manifest, 'utf8');
const computedHash = createHash('sha256').update(manifestRaw).digest('hex');

if (computedHash !== args.approvalHash) {
  console.error(`approval-hash mismatch: expected ${args.approvalHash}, got ${computedHash}`);
  process.exit(1);
}

// Bundle the thinking-games engine to validate.
const temp = mkdtempSync(join(tmpdir(), 'thinking-games-promote-'));
const outfile = join(temp, 'engine.mjs');
await build({
  entryPoints: [join(root, 'src/lib/thinking-games/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  logLevel: 'silent',
});

const engine = await import(`${pathToFileURL(outfile).href}?v=${computedHash}`);
rmSync(temp, { recursive: true, force: true });

const parsed = JSON.parse(manifestRaw);

// Verify the manifest passes the release profile validator.
const validation = engine.validateManifest(parsed, { profile: 'release' });
if (!validation.ok) {
  console.error('manifest fails release validation:');
  for (const error of validation.errors) {
    console.error(`  ${error.code}: ${error.path}: ${error.message}`);
  }
  process.exit(1);
}

// Verify every item is approved with editorial review.
const manifest = engine.parseManifest(parsed);
let denied = false;
for (const item of manifest.items) {
  if (item.status !== 'approved') {
    console.error(`item ${item.id} is not approved (status=${item.status})`);
    denied = true;
  }
  if (item.editorial === null) {
    console.error(`item ${item.id} has no editorial review`);
    denied = true;
  }
}
if (denied) {
  console.error('promotion refused: not all items are approved with editorial review');
  process.exit(1);
}

// Stamp the human editorial approval.
const approved = {
  ...manifest,
  editorialApproval: {
    approvalHash: args.approvalHash,
    editorialSignature: args.editorialSignature,
    approvedAt: new Date().toISOString(),
    note: 'Promoted by promote-thinking-games-release.mjs (PREPARATION artifact only).',
  },
};

// Write LOCAL import artifact only - NOT the serving release-365-v2.json.
const outputPath = args.output ?? join(
  root,
  'content/thinking-games/manifests',
  `${manifest.manifestVersion}.approved.json`,
);
mkdirSync(join(root, 'content/thinking-games/manifests'), { recursive: true });
const raw = JSON.stringify(approved, null, 2) + '\n';
writeFileSync(outputPath, raw);

const digest = createHash('sha256').update(raw).digest('hex');
console.log(JSON.stringify({
  ok: true,
  artifactPath: outputPath,
  digest,
  approvalHash: args.approvalHash,
  itemCount: manifest.items.length,
  ageTracks: manifest.ageTracks,
  editorialSignatureProvided: true,
  note: 'LOCAL import artifact only - not serving. Operator must manually promote to release-365-v2.json after human sign-off.',
}, null, 2));
