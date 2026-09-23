const MASCOT_CHANGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export function getMascotChangeAvailableAt(
  selectedAt: string | null,
  now: Date = new Date(),
): Date | null {
  if (!selectedAt) return null;
  const selectedTime = Date.parse(selectedAt);
  if (!Number.isFinite(selectedTime)) return null;
  const availableAt = selectedTime + MASCOT_CHANGE_INTERVAL_MS;
  return now.getTime() < availableAt ? new Date(availableAt) : null;
}
