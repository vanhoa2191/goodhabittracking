import { describe, expect, it } from 'vitest';
import {
  DEV_ONLY_ALLOWLIST,
  expiredEntries,
  findBlockingAdvisories,
  parseAuditResult,
} from '../../scripts/check-audit.mjs';

const braces = {
  source: 1101234,
  title: 'braces vulnerable to stack-exhaustion denial of service through deeply nested patterns',
  url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
  severity: 'high',
};

const report = {
  vulnerabilities: {
    braces: { severity: 'high', via: [braces] },
    micromatch: { severity: 'high', via: ['braces'] },
    next: {
      severity: 'critical',
      via: [{ title: 'Next issue', url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc', severity: 'critical' }],
    },
    lodash: {
      severity: 'moderate',
      via: [{ title: 'Moderate issue', url: 'https://github.com/advisories/GHSA-dddd-eeee-ffff', severity: 'moderate' }],
    },
  },
};

const allowlist = [{ id: 'GHSA-vfj7-8cjw-p6xm', reason: 'dev only', expires: '2026-11-03' }];

describe('dependency audit', () => {
  it('accepts an npm vulnerability report even though npm exits one', () => {
    expect(parseAuditResult({
      status: 1,
      signal: null,
      error: undefined,
      stdout: JSON.stringify({
        auditReportVersion: 2,
        vulnerabilities: report.vulnerabilities,
        metadata: { vulnerabilities: { total: 2 } },
      }),
      stderr: '',
    })).toMatchObject({ vulnerabilities: report.vulnerabilities });
  });

  it.each([
    ['a registry error payload', { status: 1, signal: null, error: undefined, stdout: '{"error":{"code":"E503"}}', stderr: '' }],
    ['an empty response', { status: 1, signal: null, error: undefined, stdout: '', stderr: 'registry unavailable' }],
    ['malformed JSON', { status: 1, signal: null, error: undefined, stdout: '{bad', stderr: '' }],
    ['a report without audit metadata', { status: 1, signal: null, error: undefined, stdout: '{"vulnerabilities":{}}', stderr: '' }],
    ['a spawn error', { status: null, signal: null, error: new Error('spawn failed'), stdout: '', stderr: '' }],
    ['a killed process', { status: null, signal: 'SIGTERM', error: undefined, stdout: '', stderr: '' }],
  ])('rejects %s instead of reporting a clean audit', (_label, result) => {
    expect(() => parseAuditResult(result)).toThrow(/npm audit/i);
  });

  it('blocks high and critical advisories that are not allowlisted', () => {
    const blocking = findBlockingAdvisories(report, allowlist, '2026-10-03');
    expect(blocking).toHaveLength(1);
    expect(blocking[0]).toContain('GHSA-aaaa-bbbb-cccc');
  });

  it('accepts an allowlisted advisory and the packages that only inherit it', () => {
    const onlyBraces = { vulnerabilities: { braces: report.vulnerabilities.braces, micromatch: report.vulnerabilities.micromatch } };
    expect(findBlockingAdvisories(onlyBraces, allowlist, '2026-10-03')).toEqual([]);
  });

  it('stops accepting an allowlisted advisory once it expires', () => {
    const onlyBraces = { vulnerabilities: { braces: report.vulnerabilities.braces } };
    expect(findBlockingAdvisories(onlyBraces, allowlist, '2026-11-04')).toHaveLength(1);
    expect(expiredEntries(allowlist, '2026-11-04')).toEqual(allowlist);
  });

  it('never exempts anything when checking production dependencies', () => {
    expect(findBlockingAdvisories({ vulnerabilities: { braces: report.vulnerabilities.braces } }, [], '2026-10-03')).toHaveLength(1);
  });

  it('keeps a reason and an expiry on every allowlist entry', () => {
    for (const entry of DEV_ONLY_ALLOWLIST) {
      expect(entry.reason.length).toBeGreaterThan(20);
      expect(entry.expires).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
