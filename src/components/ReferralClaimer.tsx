'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { clearReferralCookieString, normalizeReferralCode, readReferralCookie } from '@/lib/referral/referral-code';

const SESSION_HINT_DOMAIN = process.env.NEXT_PUBLIC_SESSION_HINT_DOMAIN?.trim() || null;
const FINAL_ANSWERS = new Set(['claimed', 'invalid', 'self', 'expired', 'already_referred', 'disabled']);

/**
 * Attributes a newly signed-in family to the referral code the visitor arrived with. The code travels
 * in a cookie set by the public site (or by a ?ref= link on this site); the server decides whether it
 * counts, and the cookie is dropped once the server has given a final answer.
 */
export function ReferralClaimer() {
  const { currentUser, familyId, familyRole, isEntryReady } = useAppStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || !currentUser || !familyId || !isEntryReady) return;
    if (familyRole !== 'owner' && familyRole !== 'parent' && familyRole !== 'guardian') return;

    const fromUrl = normalizeReferralCode(new URLSearchParams(window.location.search).get('ref'));
    const code = readReferralCookie(document.cookie) ?? fromUrl;
    if (!code) return;
    attempted.current = true;

    void fetch('/api/referral/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code }),
    }).then(async (response) => {
      const body: unknown = await response.json().catch(() => null);
      const status = typeof body === 'object' && body !== null ? (body as { status?: unknown }).status : null;
      if (typeof status === 'string' && FINAL_ANSWERS.has(status)) {
        document.cookie = clearReferralCookieString(SESSION_HINT_DOMAIN);
        document.cookie = clearReferralCookieString(null);
      } else {
        attempted.current = false;
      }
    }).catch(() => { attempted.current = false; });
  }, [currentUser, familyId, familyRole, isEntryReady]);

  return null;
}
