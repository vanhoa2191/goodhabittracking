export function getLocalDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isConsecutiveDate(previous: string, current: string): boolean {
  const previousUtc = Date.parse(`${previous}T00:00:00Z`);
  const currentUtc = Date.parse(`${current}T00:00:00Z`);
  return Number.isFinite(previousUtc) && currentUtc - previousUtc === 86_400_000;
}
