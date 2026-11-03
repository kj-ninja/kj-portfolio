import { isLocale, type Locale } from "../i18n/locales";

/** Collection ids are `<locale>/<slug>` because files live in `src/content/<collection>/<locale>/`. */
export function splitId(id: string): { locale: Locale; slug: string } {
  const slash = id.indexOf("/");
  const locale = slash === -1 ? id : id.slice(0, slash);
  if (!isLocale(locale)) throw new Error(`Content id "${id}" must start with a locale (en/ or pl/)`);
  const slug = slash === -1 ? "" : id.slice(slash + 1);
  if (slug === "")
    throw new Error(`Content id "${id}" is missing the slug after the locale (expected ${locale}/<slug>)`);
  return { locale, slug };
}

/**
 * The entry's locale when it differs from the page locale (an English fallback on a Polish page),
 * otherwise undefined. Meant for `lang` attributes (WCAG 3.1.2): undefined renders no attribute.
 */
export function foreignLang(entry: { id: string }, pageLocale: Locale): Locale | undefined {
  const { locale } = splitId(entry.id);
  return locale === pageLocale ? undefined : locale;
}
