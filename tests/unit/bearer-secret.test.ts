import { describe, expect, it } from 'vitest';
import { hasBearerSecret } from '@/lib/security/bearer-secret';

const withAuthorization = (value: string) => new Request('https://app.kidhabithero.com/api/health', {
  headers: { authorization: value },
});

describe('hasBearerSecret', () => {
  it('accepts the configured secret', () => {
    expect(hasBearerSecret(withAuthorization('Bearer operations-secret'), 'operations-secret')).toBe(true);
  });

  it.each(['Bearer operations-secreT', 'Bearer short', 'operations-secret-x'])('refuses %j', (value) => {
    expect(hasBearerSecret(withAuthorization(value), 'operations-secret')).toBe(false);
  });

  it('refuses a header with as many characters but more bytes instead of throwing', () => {
    expect(hasBearerSecret(withAuthorization('Bearer operations-secré'), 'operations-secret')).toBe(false);
  });

  it('refuses everything when no secret is configured', () => {
    expect(hasBearerSecret(withAuthorization('Bearer '), undefined)).toBe(false);
  });
});
