import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyResendWebhook } from '@/lib/lifecycle/resend-webhook';

const key = Buffer.from('webhook-test-secret');
const secret = `whsec_${key.toString('base64')}`;
const id = 'msg_123';
const timestamp = '1790557200';
const payload = JSON.stringify({
  type: 'email.bounced',
  data: { email_id: 'email_123', to: ['parent@example.test'] },
});

function signature(body = payload) {
  const value = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return `v1,${value}`;
}

describe('Resend lifecycle webhook verification', () => {
  it('accepts a current signed suppression event', () => {
    expect(verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: signature(),
      secret,
      now: Number(timestamp),
    })).toEqual(expect.objectContaining({ type: 'email.bounced' }));
  });

  it('rejects tampering and stale events', () => {
    expect(verifyResendWebhook({
      payload: `${payload} `,
      id,
      timestamp,
      signature: signature(),
      secret,
      now: Number(timestamp),
    })).toBeNull();
    expect(verifyResendWebhook({
      payload,
      id,
      timestamp,
      signature: signature(),
      secret,
      now: Number(timestamp) + 301,
    })).toBeNull();
  });
});
