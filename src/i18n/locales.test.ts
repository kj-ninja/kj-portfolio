import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, otherLocale, toLocale } from "./locales";

describe("locales", () => {
  it("recognises supported locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("pl")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("returns the other locale", () => {
    expect(otherLocale("en")).toBe("pl");
    expect(otherLocale("pl")).toBe("en");
  });

  it("normalises unknown input to the default locale", () => {
    expect(toLocale(undefined)).toBe(defaultLocale);
    expect(toLocale("de")).toBe(defaultLocale);
    expect(toLocale("pl")).toBe("pl");
  });
});
