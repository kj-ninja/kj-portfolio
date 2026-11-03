import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from "astro:i18n";
import { type Locale, locales } from "../i18n/locales";
import { type Alternate, alternateLinks } from "./alternates";

/** `localeUrl("pl", "lab")` → `/pl/lab/`; `localeUrl("en", "")` → `/`. */
export function localeUrl(locale: Locale, path: string): string {
  return getRelativeLocaleUrl(locale, path);
}

export function canonical(locale: Locale, path: string): string {
  return getAbsoluteLocaleUrl(locale, path);
}

/**
 * hreflang alternates for one locale-less path, limited to `available` locales (default: all).
 * The rule (which locales, when x-default) lives in `alternateLinks` (src/lib/alternates.ts).
 */
export function alternates(path: string, available: readonly Locale[] = locales): Alternate[] {
  return alternateLinks(available, (locale) => getAbsoluteLocaleUrl(locale, path));
}
