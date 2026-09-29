import { describe, expect, it } from 'vitest';
import { dataUrlToBlob, qrFileName } from '@/lib/save-qr-image';

describe('save-qr-image', () => {
  it('names the file after the order so several QR codes do not collide', () => {
    expect(qrFileName(123456)).toBe('kidhabit-qr-123456.png');
  });

  it('decodes a base64 PNG data URL without using fetch', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,cXJjb2Rl');
    expect(blob.type).toBe('image/png');
    expect(await blob.text()).toBe('qrcode');
  });

  it('decodes a percent-encoded data URL', async () => {
    const blob = dataUrlToBlob('data:image/svg+xml,%3Csvg%2F%3E');
    expect(blob.type).toBe('image/svg+xml');
    expect(await blob.text()).toBe('<svg/>');
  });

  it('rejects values that are not data URLs', () => {
    expect(() => dataUrlToBlob('https://example.com/qr.png')).toThrow('Unsupported image data.');
  });
});
