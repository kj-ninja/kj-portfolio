import { describe, expect, it } from "vitest";
import { groupByStatus, selectLocalized } from "./select";

const e = (id: string, order: number) => ({ id, data: { order } });

describe("selectLocalized", () => {
  const all = [e("en/a", 2), e("pl/a", 2), e("en/b", 1), e("pl/c", 3), e("en/c", 3)];

  it("prefers the requested locale for pl", () => {
    expect(selectLocalized(all, "pl").map((x) => x.id)).toEqual(["en/b", "pl/a", "pl/c"]);
  });

  it("falls back to English when no pl file exists", () => {
    expect(selectLocalized([e("en/a", 1)], "pl").map((x) => x.id)).toEqual(["en/a"]);
  });

  it("returns English only for en even when pl exists, regardless of input order", () => {
    expect(selectLocalized([...all].reverse(), "en").map((x) => x.id)).toEqual(["en/b", "en/a", "en/c"]);
  });

  it("sorts by order", () => {
    expect(selectLocalized([e("en/x", 3), e("en/y", 1), e("en/z", 2)], "en").map((x) => x.id)).toEqual([
      "en/y",
      "en/z",
      "en/x",
    ]);
  });
});

describe("groupByStatus", () => {
  const s = (id: string, order: number, status: "ready" | "building" | "planned") => ({ id, data: { order, status } });

  it("counts each status separately", () => {
    const { counts } = groupByStatus([
      s("en/a", 1, "ready"),
      s("en/b", 2, "building"),
      s("en/c", 3, "planned"),
      s("en/d", 4, "building"),
    ]);
    expect(counts).toEqual({ ready: 1, building: 2, planned: 1 });
  });

  it("keeps ready and building entries in order and moves planned ones after them", () => {
    const groups = groupByStatus([
      s("en/p", 1, "planned"),
      s("en/b", 2, "building"),
      s("en/r", 3, "ready"),
      s("en/q", 4, "planned"),
    ]);
    expect(groups.listed.map((x) => x.id)).toEqual(["en/b", "en/r"]);
    expect(groups.planned.map((x) => x.id)).toEqual(["en/p", "en/q"]);
  });

  it("reports zero planned entries when there are none", () => {
    const groups = groupByStatus([s("en/a", 1, "building")]);
    expect(groups.counts.planned).toBe(0);
    expect(groups.planned).toEqual([]);
  });
});
