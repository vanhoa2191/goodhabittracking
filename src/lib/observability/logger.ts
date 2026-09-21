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
    if (typeof value === 'string') sanitized[key] = value.slice(0, 160);
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
