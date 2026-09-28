'use client';

import { useEffect, useRef, useState } from 'react';
import { Keyboard, LoaderCircle } from 'lucide-react';
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
  const [state, setState] = useState<'requesting' | 'active' | 'invalid' | 'denied' | 'unavailable' | 'error'>('requesting');
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
        setState('unavailable');
        return;
      }
      const nextScanner = new QrScanner(video, (result) => {
        const token = extractPairingToken(result.data, window.location.origin);
        if (!token) {
          setState('invalid');
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
        if (!disposed) setState('active');
      } catch (caught: unknown) {
        if (!disposed) {
          nextScanner.stop();
          nextScanner.destroy();
          const denied = caught instanceof DOMException && (caught.name === 'NotAllowedError' || caught.name === 'SecurityError');
          setState(denied ? 'denied' : 'error');
        }
      }
    }).catch(() => {
      if (!disposed) setState('unavailable');
    });

    return () => {
      disposed = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [copy.cameraDenied, copy.cameraUnavailable, copy.invalidQr, onDetected]);

  const message = state === 'invalid'
    ? copy.invalidQr
    : state === 'denied'
      ? copy.cameraDenied
      : state === 'unavailable' || state === 'error'
        ? copy.cameraUnavailable
        : null;
  const terminal = state === 'denied' || state === 'unavailable' || state === 'error';

  return (
    <div className="space-y-3" role="region" aria-label={copy.scannerLabel}>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-950">
        <video ref={videoRef} muted playsInline aria-hidden="true" className="h-full w-full object-cover" />
        {state === 'requesting' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white/80">
            <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
          </div>
        )}
      </div>
      {state === 'requesting' && <p role="status" className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Đang mở camera…</p>}
      {state === 'active' && <p role="status" className="text-center text-sm font-semibold text-slate-600 dark:text-slate-300">Đưa mã QR vào giữa khung.</p>}
      {message && (
        <p role={terminal ? 'alert' : 'status'} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          {message} {terminal ? copy.manualFallback : ''}
        </p>
      )}
      <button type="button" onClick={onCancel} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-slate-200">
        <Keyboard aria-hidden="true" className="h-4 w-4" />
        {copy.useManualCode}
      </button>
    </div>
  );
}
