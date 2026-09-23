'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, LoaderCircle, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getDeviceConnectCopy } from '@/lib/i18n/device-connect-copy';

type ChildQrScannerProps = {
  readonly onCancel: () => void;
  readonly onDetected: (token: string) => void;
};

export function extractPairingToken(payload: string, currentOrigin: string): string | null {
  try {
    const url = new URL(payload);
    if (url.origin !== currentOrigin) return null;
    const token = url.searchParams.get('pair');
    return token && token.length >= 32 ? token : null;
  } catch {
    return null;
  }
}

export function ChildQrScanner({ onCancel, onDetected }: ChildQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { language } = useTranslation();
  const copy = getDeviceConnectCopy(language);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let scanner: { destroy: () => void; start: () => Promise<void>; stop: () => void } | null = null;

    void import('qr-scanner').then(async ({ default: QrScanner }) => {
      if (disposed) return;
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !(await QrScanner.hasCamera())) {
        setError(copy.cameraUnavailable);
        return;
      }
      const nextScanner = new QrScanner(video, (result) => {
        const token = extractPairingToken(result.data, window.location.origin);
        if (!token) {
          setError(copy.invalidQr);
          return;
        }
        nextScanner.stop();
        onDetected(token);
      }, {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      });
      scanner = nextScanner;
      try {
        await nextScanner.start();
      } catch (caught: unknown) {
        if (!disposed) setError(caught instanceof Error ? copy.cameraDenied : copy.cameraUnavailable);
      }
    }).catch(() => {
      if (!disposed) setError(copy.cameraUnavailable);
    });

    return () => {
      disposed = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [copy.cameraDenied, copy.cameraUnavailable, copy.invalidQr, onDetected]);

  return (
    <div className="space-y-3" aria-label={copy.scannerLabel}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-950">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/80">
            <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {error} {copy.manualFallback}
        </p>
      )}
      <button type="button" onClick={onCancel} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-slate-200">
        {error ? <Camera className="h-4 w-4" /> : <X className="h-4 w-4" />}
        {copy.useManualCode}
      </button>
    </div>
  );
}
