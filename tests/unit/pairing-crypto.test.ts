import { describe, expect, it } from 'vitest';
import {
  createDisplayCode,
  createSessionToken,
  normalizeDisplayCode,
  sha256Hex,
} from '@/lib/pairing/crypto';

describe('pairing cryptography', () => {
  it('creates a human-readable challenge identifier and verifier', () => {
    const { code, codeId } = createDisplayCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(code.startsWith(codeId)).toBe(true);
  });

  it('normalizes equivalent user input and rejects ambiguous input', () => {
    expect(normalizeDisplayCode('7kpm 4xq2')).toBe('7KPM-4XQ2');
    expect(normalizeDisplayCode('HERO-8492')).toBeNull();
    expect(normalizeDisplayCode('IIII-0000')).toBeNull();
  });

  it('creates a 256-bit opaque session token and stores only its digest', async () => {
    const token = createSessionToken();
    const digest = await sha256Hex(token);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).not.toContain(token);
  });
});
