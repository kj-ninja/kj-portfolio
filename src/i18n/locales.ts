export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "pl" : "en";
}

/** Astro.currentLocale is `string | undefined`; normalise it once at the page boundary. */
export function toLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}
