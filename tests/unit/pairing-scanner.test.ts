import { describe, expect, it } from 'vitest';
import { extractPairingToken } from '@/components/ChildQrScanner';

describe('pairing scanner payload', () => {
  it('accepts a pairing deep link from the current application origin', () => {
    // Given
    const payload = 'https://kid.example/?pair=qr-token-with-at-least-thirty-two-characters';

    // When
    const token = extractPairingToken(payload, 'https://kid.example');

    // Then
    expect(token).toBe('qr-token-with-at-least-thirty-two-characters');
  });

  it('rejects a pairing deep link from a different origin', () => {
    // Given
    const payload = 'https://evil.example/?pair=qr-token-with-at-least-thirty-two-characters';

    // When
    const token = extractPairingToken(payload, 'https://kid.example');

    // Then
    expect(token).toBeNull();
  });
});
