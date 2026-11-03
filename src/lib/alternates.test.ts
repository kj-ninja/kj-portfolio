import { expect, it } from "vitest";
import { alternateLinks } from "./alternates";

const href = (locale: string) => `https://example.test/${locale}/x/`;

it("emits en, pl and x-default (pointing at en) when both locales have the page", () => {
  expect(alternateLinks(["en", "pl"], href)).toEqual([
    { hreflang: "en", href: "https://example.test/en/x/" },
    { hreflang: "pl", href: "https://example.test/pl/x/" },
    { hreflang: "x-default", href: "https://example.test/en/x/" },
  ]);
});

it("emits en and x-default when only English has the page", () => {
  expect(alternateLinks(["en"], href)).toEqual([
    { hreflang: "en", href: "https://example.test/en/x/" },
    { hreflang: "x-default", href: "https://example.test/en/x/" },
  ]);
});

it("emits only pl, without x-default, when only Polish has the page", () => {
  expect(alternateLinks(["pl"], href)).toEqual([{ hreflang: "pl", href: "https://example.test/pl/x/" }]);
});

it("keeps the canonical locale order regardless of input order", () => {
  expect(alternateLinks(["pl", "en"], href).map((alt) => alt.hreflang)).toEqual(["en", "pl", "x-default"]);
});
