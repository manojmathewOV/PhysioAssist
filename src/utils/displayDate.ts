/** Shared detailed-history date; locale changes presentation, never the saved instant. */
export function historyDate(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
