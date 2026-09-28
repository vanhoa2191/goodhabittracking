type LogLevel = 'info' | 'warn' | 'error';

const ALLOWED_FIELDS = new Set([
  'operation',
  'reasonCode',
  'correlationId',
  'route',
  'status',
  'durationMs',
]);

export function createCorrelationId(): string {
  return crypto.randomUUID();
}

export function sanitizeEvent(fields: Record<string, unknown>): Record<string, string | number> {
  const sanitized: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_FIELDS.has(key)) continue;
    if (typeof value === 'string') {
      const shortened = value.slice(0, 160);
      const safe = key === 'correlationId'
        ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(shortened)
        : key === 'route'
          ? /^\/[a-z0-9/_-]*$/i.test(shortened)
          : /^[a-z0-9_.:/-]+$/i.test(shortened);
      sanitized[key] = safe ? shortened : 'redacted';
    }
    if (typeof value === 'number' && Number.isFinite(value)) sanitized[key] = value;
  }
  return sanitized;
}

export function logOperationalEvent(level: LogLevel, fields: Record<string, unknown>) {
  const event = JSON.stringify({ timestamp: new Date().toISOString(), level, ...sanitizeEvent(fields) });
  if (level === 'error') console.error(event);
  else if (level === 'warn') console.warn(event);
  else console.info(event);
}
