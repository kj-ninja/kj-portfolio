import { describe, expect, it } from "vitest";
import { locales } from "./locales";
import { t, type UiKey, ui } from "./ui";

describe("ui strings", () => {
  it("has the same keys in every locale", () => {
    const enKeys = Object.keys(ui.en).sort();
    for (const locale of locales) {
      expect(Object.keys(ui[locale]).sort()).toEqual(enKeys);
    }
  });

  it("has no empty strings", () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(ui[locale])) {
        expect(value.trim(), `${locale}.${key}`).not.toBe("");
      }
    }
  });

  it("uses the same {placeholder} tokens in every locale", () => {
    const tokens = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(ui.en) as UiKey[]) {
      expect(tokens(ui.pl[key]), `pl.${key}`).toEqual(tokens(ui.en[key]));
    }
  });

  it("interpolates {vars}", () => {
    expect(t("en", "meta.readingMinutes", { n: 6 })).toBe("6 min");
    expect(t("pl", "meta.readingMinutes", { n: 6 })).toBe("6 min");
  });

  it("keeps the placeholder when a var is missing", () => {
    const key: UiKey = "meta.readingMinutes";
    expect(t("en", key)).toBe("{n} min");
    expect(t("en", key, {})).toBe("{n} min");
    expect(t("en", key, { other: 1 })).toBe("{n} min");
  });
});
