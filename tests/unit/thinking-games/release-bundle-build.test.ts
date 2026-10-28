import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const manifestPath = resolve('content/thinking-games/manifests/release-365-v1.json');
const proofPath = resolve('content/thinking-games/manifests/release-365-v1.validation.json');
const temporary: string[] = [];
function fixture(name: string, contents: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'release-bundle-negative-'));
  temporary.push(directory);
  const path = join(directory, name);
  writeFileSync(path, contents);
  return path;
}
function verify(args: string[] = []) {
  return spawnSync(process.execPath, ['scripts/check-thinking-games-release-bundle.mjs', ...args], { encoding: 'utf8' });
}
afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

describe('production build release admission', () => {
  it('fully validates the exact reviewed bytes before the Worker can bundle them', { timeout: 30000 }, () => {
    const result = verify();
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ status: 'passed', itemCount: 1460, completeReleaseValidation: true });
  });
  it('rejects changed catalog bytes even when counts, statuses and the old proof remain valid', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.items[0].title += ' altered';
    const path = fixture('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    const result = verify(['--manifest', path]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not match the reviewed pin');
  });
  it.each(['manifestDigest', 'validationProfile'])('rejects a stale %s in the bundled proof', (key) => {
    const proof = JSON.parse(readFileSync(proofPath, 'utf8'));
    proof[key] = 'invalid';
    const path = fixture('proof.json', JSON.stringify(proof));
    const result = verify(['--proof', path]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('proof is stale or invalid');
  });
});
