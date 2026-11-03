import { type Locale, locales } from "../i18n/locales";

/**
 * Locale-less path the language switch should target from a note page: the translated note when
 * the other locale has the same slug, otherwise the other locale's notes index.
 */
export function noteSwitchPath(slug: string, otherLocaleSlugs: readonly string[]): string {
  return otherLocaleSlugs.includes(slug) ? `notes/${slug}` : "notes";
}

/** Locales that actually have a page for this note slug, in `locales` order (hreflang must not advertise 404s). */
export function alternateLocalesFor(slug: string, slugsByLocale: Record<Locale, readonly string[]>): Locale[] {
  return locales.filter((locale) => slugsByLocale[locale].includes(slug));
}
