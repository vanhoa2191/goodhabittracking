import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = resolve('scripts/check-secrets.mjs');
const directories: string[] = [];

function scan(fileContent: string) {
  const directory = mkdtempSync(join(tmpdir(), 'secret-scan-'));
  directories.push(directory);
  execFileSync('git', ['init', '-q'], { cwd: directory });
  writeFileSync(join(directory, 'sample.env'), fileContent);
  return spawnSync('node', [script], { cwd: directory, encoding: 'utf8' });
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('secret scan', () => {
  it.each(['CRON_SECRET', 'RESEND_API_KEY', 'RESEND_WEBHOOK_SECRET', 'CLOUDFLARE_API_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY'])(
    'rejects a real value for %s',
    (name) => {
      const result = scan(`${name}=k9x2m4p7q1w8e5r3t6y0\n`);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('private environment value');
    },
  );

  it('rejects provider tokens by their shape', () => {
    expect(scan(`token = re_${'a1B2c3D4'.repeat(4)}\n`).status).toBe(1);
    expect(scan(`token = sbp_${'0123456789abcdef'.repeat(2)}01234567\n`).status).toBe(1);
  });

  it('accepts empty and placeholder values', () => {
    expect(scan('CRON_SECRET=\nRESEND_API_KEY=your-key-here\nCLOUDFLARE_API_TOKEN=<token>\n').status).toBe(0);
  });
});
