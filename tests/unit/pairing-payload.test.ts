import { describe, expect, it } from 'vitest';
import { derivePairingCredential } from '@/lib/pairing/crypto';

describe('persistent pairing credential derivation', () => {
  it('creates distinct manual and QR credentials for one rotation nonce', async () => {
    // Given
    const secret = 'test-secret-at-least-32-characters';

    // When
    const result = await derivePairingCredential('child-id', 'rotation-nonce', secret);

    // Then
    expect(result.code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(result.token.length).toBeGreaterThanOrEqual(32);
    expect(result.code).not.toContain(result.token);
  });

  it('is stable for the same child, nonce, and secret', async () => {
    // Given
    const input = ['child-id', 'rotation-nonce', 'test-secret-at-least-32-characters'] as const;

    // When
    const first = await derivePairingCredential(...input);
    const second = await derivePairingCredential(...input);

    // Then
    expect(second).toEqual(first);
  });

  it('rotates both credential forms when the nonce changes', async () => {
    // Given
    const secret = 'test-secret-at-least-32-characters';

    // When
    const previous = await derivePairingCredential('child-id', 'old-nonce', secret);
    const rotated = await derivePairingCredential('child-id', 'new-nonce', secret);

    // Then
    expect(rotated.code).not.toBe(previous.code);
    expect(rotated.token).not.toBe(previous.token);
  });
});
