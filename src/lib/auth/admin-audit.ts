const ALLOWED_SNAPSHOT_FIELDS = new Set([
  'active',
  'bonusDays',
  'caseType',
  'discountPercent',
  'expiresAt',
  'hasDisplayName',
  'hasNotes',
  'hasPhone',
  'marketingConsent',
  'maxRedemptions',
  'plan',
  'resolutionCode',
  'role',
  'status',
  'subscriptionEndsAt',
  'tagCount',
  'trialEndsAt',
]);

type AuditValue = string | number | boolean | null;

export function minimizeAdminAuditSnapshot(
  fields: Record<string, unknown> | null | undefined,
): Record<string, AuditValue> {
  if (!fields) return {};
  const minimized: Record<string, AuditValue> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_SNAPSHOT_FIELDS.has(key)) continue;
    if (
      value === null
      || typeof value === 'string'
      || typeof value === 'boolean'
      || (typeof value === 'number' && Number.isFinite(value))
    ) {
      minimized[key] = typeof value === 'string' ? value.slice(0, 160) : value;
    }
  }

  return minimized;
}
