import { expect, it } from "vitest";
import { formatDate, isoDate } from "./dates";

const day = new Date("2026-11-02"); // UTC midnight, as Astro parses a frontmatter date

it("formats in the page locale and style", () => {
  expect(formatDate("en", day, "long")).toBe("November 2, 2026");
  expect(formatDate("pl", day, "long")).toBe("2 listopada 2026");
  expect(formatDate("en", day, "medium")).toBe("Nov 2, 2026");
});

it("formats in UTC, so late-evening UTC times keep their calendar day", () => {
  expect(formatDate("en", new Date("2026-11-02T23:30:00Z"), "medium")).toBe("Nov 2, 2026");
});

it("gives the UTC calendar day for datetime attributes", () => {
  expect(isoDate(day)).toBe("2026-11-02");
  expect(isoDate(new Date("2026-11-02T23:30:00Z"))).toBe("2026-11-02");
});
