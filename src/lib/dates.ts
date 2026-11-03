import type { Locale } from "../i18n/locales";

/**
 * Human date in the page locale. Frontmatter dates are calendar days parsed as UTC midnight, so the
 * formatter runs in UTC too; otherwise a build machine west of UTC would print the previous day.
 */
export function formatDate(locale: Locale, date: Date, style: "medium" | "long"): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: "UTC" }).format(date);
}

/** `YYYY-MM-DD` (UTC) for `<time datetime>`. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
