import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Advisories accepted for development tooling only. Each entry needs a reason and an expiry date, so it
 * is looked at again; dependencies that ship to production are never exempt (see `main`).
 */
export const DEV_ONLY_ALLOWLIST = [
  {
    id: 'GHSA-vfj7-8cjw-p6xm',
    reason: 'braces <= 3.0.3 has no patched release; it reaches the project only through eslint-config-next (lint), never the app bundle.',
    expires: '2026-11-03',
  },
];

const blockingSeverities = new Set(['high', 'critical']);

function advisoryId(via) {
  return via.url?.match(/GHSA-[a-z0-9-]+/i)?.[0] ?? String(via.source ?? via.title ?? 'unknown');
}

/** High or critical advisories in an `npm audit --json` report that the allowlist does not cover today. */
export function findBlockingAdvisories(report, allowlist, today) {
  const accepted = new Set(allowlist.filter((entry) => entry.expires >= today).map((entry) => entry.id));
  const blocking = new Map();
  for (const [name, vulnerability] of Object.entries(report?.vulnerabilities ?? {})) {
    for (const via of vulnerability.via ?? []) {
      if (typeof via !== 'object' || !blockingSeverities.has(via.severity)) continue;
      const id = advisoryId(via);
      if (!accepted.has(id)) blocking.set(id, `${id} (${via.severity}) in ${name}: ${via.title ?? ''}`.trim());
    }
  }
  return [...blocking.values()];
}

/** Allowlist entries whose expiry has passed, so they must be removed or renewed with a fresh reason. */
export function expiredEntries(allowlist, today) {
  return allowlist.filter((entry) => entry.expires < today);
}

function audit(extraArguments) {
  const result = spawnSync('npm', ['audit', '--json', ...extraArguments], { encoding: 'utf8' });
  if (!result.stdout) throw new Error(`npm audit produced no report: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function main() {
  const today = new Date().toISOString().slice(0, 10);
  const failures = [];

  for (const entry of expiredEntries(DEV_ONLY_ALLOWLIST, today)) {
    failures.push(`Allowlist entry ${entry.id} expired on ${entry.expires}; remove it or renew it with a current reason.`);
  }
  for (const advisory of findBlockingAdvisories(audit(['--omit=dev']), [], today)) {
    failures.push(`Production dependency: ${advisory}`);
  }
  for (const advisory of findBlockingAdvisories(audit([]), DEV_ONLY_ALLOWLIST, today)) {
    failures.push(advisory);
  }

  if (failures.length > 0) {
    process.stderr.write(`Dependency audit failed:\n${failures.join('\n')}\n`);
    process.exit(1);
  }
  process.stdout.write('Dependency audit passed: no high or critical advisories outside the dev-only allowlist.\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
