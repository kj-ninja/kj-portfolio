import { describe, expect, it } from "vitest";
import rendered from "../../scripts/og/rendered-text.json";
import { locales } from "../i18n/locales";
import { t } from "../i18n/ui";
import { ogText } from "./og-text";

describe("ogText", () => {
  it.each(locales)("is the home hero copy from ui.ts (%s)", (locale) => {
    expect(ogText(locale)).toEqual({
      eyebrow: t(locale, "home.eyebrow"),
      before: t(locale, "home.headline.before"),
      accent: t(locale, "home.headline.accent"),
      after: t(locale, "home.headline.after"),
    });
  });

  it("matches the text the committed OG images were rendered from (run `bun run og` if not)", () => {
    expect(rendered).toEqual({ en: ogText("en"), pl: ogText("pl") });
  });
});
