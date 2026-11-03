import { expect, it } from "vitest";
import { alternateLocalesFor, noteSwitchPath } from "./switch-path";

it("targets the translated note when the other locale has the slug", () => {
  expect(noteSwitchPath("a", ["b", "a"])).toBe("notes/a");
});

it("falls back to the other locale's notes index when the slug is missing", () => {
  expect(noteSwitchPath("a", ["b"])).toBe("notes");
  expect(noteSwitchPath("a", [])).toBe("notes");
});

it("advertises both locales when both have the slug", () => {
  expect(alternateLocalesFor("a", { en: ["a"], pl: ["a", "b"] })).toEqual(["en", "pl"]);
});

it("advertises only the locale that has the slug", () => {
  expect(alternateLocalesFor("a", { en: ["a"], pl: ["b"] })).toEqual(["en"]);
  expect(alternateLocalesFor("a", { en: [], pl: ["a"] })).toEqual(["pl"]);
});
