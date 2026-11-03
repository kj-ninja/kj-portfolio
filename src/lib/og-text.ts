import type { Locale } from "../i18n/locales";
import { t } from "../i18n/ui";

export type OgText = { eyebrow: string; before: string; accent: string; after: string };

/**
 * Text on the Open Graph image: the home hero, so a shared link shows what the page says.
 * Read by scripts/og/render.ts; src/lib/og-text.test.ts fails when ui.ts changes and the
 * committed images were not re-rendered.
 */
export function ogText(locale: Locale): OgText {
  return {
    eyebrow: t(locale, "home.eyebrow"),
    before: t(locale, "home.headline.before"),
    accent: t(locale, "home.headline.accent"),
    after: t(locale, "home.headline.after"),
  };
}
