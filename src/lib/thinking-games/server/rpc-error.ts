const statusByCode: Record<string, number> = {
  session_invalid: 401,
  feature_off: 404,
  timezone_invalid: 400,
  invalid_slot: 400,
  day_changed: 409,
  timezone_required: 409,
  content_unavailable: 409,
  content_not_approved: 409,
  bonus_locked: 200,
  journey_complete: 409,
  paused: 409,
  attempt_expired: 409,
  already_finished: 409,
  invalid_answer: 400,
  not_found: 404,
  invalid_input: 400,
};

export function rpcErrorCode(error: { message?: string; code?: string }) {
  const message = error.message ?? '';
  return Object.keys(statusByCode).find((code) => message.includes(code)) ?? 'internal';
}

export function rpcErrorStatus(code: string) {
  return statusByCode[code] ?? 500;
}
