// Pure date helpers for the week selector. Dates are yyyy-MM-dd strings from the API; all
// arithmetic uses UTC-anchored Date objects so a browser's local timezone never shifts them.

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isIsoDateFormat(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// The backend only accepts Mondays exactly 7 days apart within the coverage bounds.
export function enumerateWeekStarts(earliestSelectableWeekStart: string, latestSelectableWeekStart: string): string[] {
  const start = parseIsoDate(earliestSelectableWeekStart);
  const end = parseIsoDate(latestSelectableWeekStart);
  const weeks: string[] = [];

  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    weeks.push(formatIsoDate(cursor));
    cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return weeks;
}

const WEEK_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

// weekEnd is the half-open exclusive boundary; display the inclusive last day (weekEnd - 1 day).
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseIsoDate(weekStart);
  const inclusiveEnd = new Date(parseIsoDate(weekEnd).getTime() - 24 * 60 * 60 * 1000);
  return `${WEEK_LABEL_FORMAT.format(start)} \u2013 ${DAY_LABEL_FORMAT.format(inclusiveEnd)}`;
}

export function formatIsoDateLong(value: string): string {
  return DAY_LABEL_FORMAT.format(parseIsoDate(value));
}
