import { defaultLocale, type Locale, locales } from "../i18n/locales";

export type Alternate = { hreflang: string; href: string };

/**
 * hreflang alternates for the locales in `available`, in `locales` order, plus x-default pointing
 * at the default locale. x-default is emitted only when the default locale has the page, so it
 * never advertises a 404. Pure (the URL builder is injected), so it is unit-testable without
 * `astro:i18n`; src/lib/routes.ts supplies the real builder.
 */
export function alternateLinks(available: readonly Locale[], href: (locale: Locale) => string): Alternate[] {
  const list: Alternate[] = locales
    .filter((locale) => available.includes(locale))
    .map((locale) => ({ hreflang: locale, href: href(locale) }));
  if (available.includes(defaultLocale)) list.push({ hreflang: "x-default", href: href(defaultLocale) });
  return list;
}
