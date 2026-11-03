import { expect, it } from "vitest";
import { foreignLang, splitId } from "./ids";

it("splits a collection id into locale and slug", () => {
  expect(splitId("en/client-cache")).toEqual({ locale: "en", slug: "client-cache" });
  expect(splitId("pl/notes/deep/slug")).toEqual({ locale: "pl", slug: "notes/deep/slug" });
});

it("throws on an id without a known locale prefix", () => {
  expect(() => splitId("client-cache")).toThrow(/locale/);
  expect(() => splitId("de/x")).toThrow(/locale/);
});

it("throws naming the missing slug for an empty or absent slug", () => {
  expect(() => splitId("en/")).toThrow(/slug/);
  expect(() => splitId("en")).toThrow(/slug/);
  expect(() => splitId("pl/")).toThrow(/slug/);
});

it("names the entry locale only when it differs from the page locale", () => {
  expect(foreignLang({ id: "en/cache" }, "pl")).toBe("en");
  expect(foreignLang({ id: "pl/cache" }, "pl")).toBeUndefined();
  expect(foreignLang({ id: "en/cache" }, "en")).toBeUndefined();
});
