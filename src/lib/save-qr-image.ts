export function qrFileName(orderCode: number): string {
  return `kidhabit-qr-${orderCode}.png`;
}

// Decoded by hand: the page's connect-src policy does not allow fetch() on data: URLs.
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/u.exec(dataUrl);
  if (!match) throw new Error('Unsupported image data.');
  const [, type = 'image/png', base64, payload] = match;
  if (!base64) return new Blob([decodeURIComponent(payload)], { type });
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

function isIosDevice(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;
  return /iPad|iPhone|iPod/u.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

/**
 * Saves the payment QR to the device. iOS Safari ignores the download attribute for
 * generated images, so there the share sheet ("Save Image") is used instead.
 * Resolves false only when the person dismissed the share sheet.
 */
export async function saveQrImage(dataUrl: string, fileName: string): Promise<boolean> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName, { type: blob.type });

  if (isIosDevice() && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      throw error;
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return true;
}
