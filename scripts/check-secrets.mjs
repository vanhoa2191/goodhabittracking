import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const detectors = [
  {
    name: 'private environment value',
    pattern: /^[ \t]*(?:export[ \t]+)?(?:PAYOS_API_KEY|PAYOS_CHECKSUM_KEY|SUPABASE_SERVICE_ROLE_KEY|PAIRING_RATE_LIMIT_SECRET|PARENT_UNLOCK_SECRET|CRON_SECRET|RESEND_API_KEY|BREVO_API_KEY|RESEND_WEBHOOK_SECRET|CLOUDFLARE_API_TOKEN|SUPABASE_ACCESS_TOKEN)[ \t]*=[ \t]*(?!$|#|your[-_]|replace[-_]|example|<)[^ \t\r\n#]+/m,
  },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: 'Resend API key', pattern: /\bre_[A-Za-z0-9_]{24,}\b/ },
  { name: 'Supabase access token', pattern: /\bsbp_[a-f0-9]{40}\b/ },
  { name: 'Supabase secret key', pattern: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/ },
];

const findings = [];

for (const file of trackedFiles) {
  if (!existsSync(file)) continue;
  if (statSync(file).size > 1_000_000) continue;

  const content = readFileSync(file, 'utf8');
  for (const detector of detectors) {
    if (detector.pattern.test(content)) findings.push(`${file}: ${detector.name}`);
  }
}

if (findings.length > 0) {
  process.stderr.write(`Potential secrets found in tracked files:\n${findings.join('\n')}\n`);
  process.exit(1);
}

process.stdout.write(`Secret scan passed for ${trackedFiles.length} tracked files.\n`);
