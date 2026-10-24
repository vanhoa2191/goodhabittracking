/**
 * Deterministic activity IDs for daily living habits.
 * Uses UUIDv5 (SHA-1) per RFC 4122 §4.3 via Web Crypto API.
 * Runs in browser, Node, and Cloudflare Workers.
 */

/** Fixed namespace UUID for daily living activity IDs. */
export const DAILY_LIVING_NAMESPACE = '6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5';

/** UUIDv5 version and variant constants. */
const UUID_VERSION = 0x50; // version 5
const UUID_VARIANT = 0x80; // RFC 4122 variant (10xx)

/**
 * Converts a UUID string to a 16-byte Uint8Array.
 */
function uuidToBytes(uuid: string): Uint8Array {
  const bytes = new Uint8Array(16);
  const parts = uuid.split('-');
  if (parts.length !== 5) throw new Error('Invalid UUID format');
  const hex = parts.join('');
  if (hex.length !== 32) throw new Error('Invalid UUID length');
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Converts 16 bytes to a UUID string with version/variant bits set.
 */
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Computes UUIDv5 (SHA-1 namespace + name) using Web Crypto.
 */
async function uuidv5(namespace: string, name: string): Promise<string> {
  const namespaceBytes = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(namespaceBytes.length + nameBytes.length);
  combined.set(namespaceBytes);
  combined.set(nameBytes, namespaceBytes.length);

  const hashBuffer = await crypto.subtle.digest('SHA-1', combined);
  const hashBytes = new Uint8Array(hashBuffer).slice(0, 16);

  // Set version (5) and variant (RFC 4122)
  hashBytes[6] = (hashBytes[6] & 0x0f) | UUID_VERSION;
  hashBytes[8] = (hashBytes[8] & 0x3f) | UUID_VARIANT;

  return bytesToUuid(hashBytes);
}

/**
 * Generates a deterministic activity ID for a daily living habit.
 * @param familyId - The family UUID
 * @param scope - Child UUID or null for "shared/all children"
 * @param templateId - The daily living template ID (must be WIT-DLY-*)
 * @returns A UUIDv5 string derived from `${familyId}|${scope ?? 'shared'}|${templateId}`
 */
export async function dailyLivingActivityId(
  familyId: string,
  scope: string | null,
  templateId: string,
): Promise<string> {
  if (!isDailyLivingTemplateId(templateId)) {
    throw new Error(`dailyLivingActivityId only supports WIT-DLY-* templates, got ${templateId}`);
  }
  const name = `${familyId}|${scope ?? 'shared'}|${templateId}`;
  return uuidv5(DAILY_LIVING_NAMESPACE, name);
}

/**
 * Checks if a template ID is a daily living template (WIT-DLY-XX).
 */
export function isDailyLivingTemplateId(id: string): boolean {
  return /^WIT-DLY-\d{2}$/.test(id);
}

/**
 * Test vector for verification against external UUIDv5 implementation.
 *
 * Reference calculation (Python):
 *   import uuid
 *   namespace = uuid.UUID('6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5')
 *   name = '11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|WIT-DLY-01'
 *   print(uuid.uuid5(namespace, name))
 *   # Expected: 99b8edd0-9b83-588b-b4f8-9b5ae8cba9ec
 *
 * This vector MUST match the output of dailyLivingActivityId with the same inputs.
 * Verification command: python3 -c "import uuid; n=uuid.UUID('6f1d5b2e-8a47-4c3e-9b0a-2d7e41c9a8f5'); print(uuid.uuid5(n, '11111111-1111-4111-8111-111111111111|22222222-2222-4222-8222-222222222222|WIT-DLY-01'))"
 */
export const TEST_VECTOR = {
  familyId: '11111111-1111-4111-8111-111111111111',
  childId: '22222222-2222-4222-8222-222222222222',
  templateId: 'WIT-DLY-01',
  expected: '99b8edd0-9b83-588b-b4f8-9b5ae8cba9ec',
} as const;