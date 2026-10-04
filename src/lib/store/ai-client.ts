'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import type { Breakdown, WeeklySummary } from '@/lib/ai/output-check';
import type { SummaryInput } from '@/lib/ai/prompts';
import type { AiLanguage } from '@/lib/ai/config';

export type AiFailureCode = 'ai_consent_required' | 'ai_quota' | 'ai_disabled' | 'ai_timeout' | 'ai_invalid_output' | 'ai_error' | 'pin' | 'network';
export type AiAnswer<T> = { readonly ok: true; readonly result: T; readonly remainingToday: number | null } | { readonly ok: false; readonly code: AiFailureCode };

const known: ReadonlySet<string> = new Set(['ai_consent_required', 'ai_quota', 'ai_disabled', 'ai_timeout', 'ai_invalid_output', 'ai_error']);
const answer = z.object({ success: z.boolean(), result: z.unknown().optional(), remainingToday: z.number().nullable().optional(), code: z.string().optional() });

async function post<T>(path: string, body: unknown, read: (result: unknown) => T | null): Promise<AiAnswer<T>> {
  try {
    const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const raw: unknown = await response.json().catch(() => null);
    if (response.status === 403 && (raw as { code?: string } | null)?.code === 'parent_pin_required') return { ok: false, code: 'pin' };
    const parsed = answer.safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'ai_error' };
    if (!response.ok || !parsed.data.success) return { ok: false, code: known.has(parsed.data.code ?? '') ? (parsed.data.code as AiFailureCode) : 'ai_error' };
    const result = read(parsed.data.result);
    return result ? { ok: true, result, remainingToday: parsed.data.remainingToday ?? null } : { ok: false, code: 'ai_invalid_output' };
  } catch {
    return { ok: false, code: 'network' };
  }
}

const breakdownResult = z.object({ steps: z.array(z.object({ text: z.string(), minutes: z.number() })).length(3) });
const summaryResult = z.object({ praise: z.string(), notice: z.string(), tryNext: z.string() });

export function requestBreakdown(input: { readonly title: string; readonly ageYears: number; readonly language: AiLanguage }): Promise<AiAnswer<Breakdown>> {
  return post('/api/ai/breakdown', input, (value) => {
    const parsed = breakdownResult.safeParse(value);
    return parsed.success ? parsed.data : null;
  });
}

export function requestWeeklySummary(input: SummaryInput): Promise<AiAnswer<WeeklySummary>> {
  return post('/api/ai/weekly-summary', input, (value) => {
    const parsed = summaryResult.safeParse(value);
    return parsed.success ? parsed.data : null;
  });
}

/** The parent's own agreement to the AI suggestions, read from and saved to the server. */
export function useAiConsent(): { enabled: boolean | null; saving: boolean; failed: boolean; save: (enabled: boolean) => Promise<void> } {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    void fetch('/api/privacy/ai-consent')
      .then(async (response) => (response.ok ? z.object({ enabled: z.boolean() }).parse(await response.json()).enabled : false))
      .catch(() => false)
      .then((value) => { if (current) setEnabled(value); });
    return () => { current = false; };
  }, []);

  const save = useCallback(async (next: boolean) => {
    setSaving(true);
    setFailed(false);
    try {
      const response = await fetch('/api/privacy/ai-consent', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled: next }) });
      if (response.ok) setEnabled(next);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }, []);

  return { enabled, saving, failed, save };
}
