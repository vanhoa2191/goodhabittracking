'use client';

import { useEffect, useState } from 'react';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function useSevenDayCutoff(): number | null {
  const [cutoff, setCutoff] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => setCutoff(Date.now() - SEVEN_DAYS_MS);
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return cutoff;
}
