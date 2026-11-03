import { describe, expect, it } from "vitest";
import { findBrokenReferences } from "./references";

const lab = (id: string, related: string[] = [], notes: string[] = []) => ({
  id,
  data: { related: related.map((r) => ({ id: r })), notes: notes.map((n) => ({ id: n })) },
});
const note = (id: string, labIds: string[] = []) => ({ id, data: { lab: labIds.map((l) => ({ id: l })) } });

describe("findBrokenReferences", () => {
  it("returns [] for a clean set", () => {
    expect(
      findBrokenReferences({
        lab: [lab("en/a", ["en/b"], ["en/n"]), lab("en/b")],
        notes: [note("en/n", ["en/a"])],
      }),
    ).toEqual([]);
  });

  it("reports a broken related slug", () => {
    expect(findBrokenReferences({ lab: [lab("en/a", ["en/nope"])], notes: [] })).toEqual([
      "lab/en/a related -> lab/en/nope",
    ]);
  });

  it("reports a broken cross-collection notes slug", () => {
    expect(findBrokenReferences({ lab: [lab("en/a", [], ["en/ghost"])], notes: [note("en/n")] })).toEqual([
      "lab/en/a notes -> notes/en/ghost",
    ]);
  });

  it("reports a broken notes.lab slug", () => {
    expect(findBrokenReferences({ lab: [lab("en/a")], notes: [note("en/n", ["en/ghost"])] })).toEqual([
      "notes/en/n lab -> lab/en/ghost",
    ]);
  });

  it("reports several at once", () => {
    const lines = findBrokenReferences({
      lab: [lab("en/a", ["en/x"], ["en/y"])],
      notes: [note("en/n", ["en/z"])],
    });
    expect(lines).toEqual([
      "lab/en/a related -> lab/en/x",
      "lab/en/a notes -> notes/en/y",
      "notes/en/n lab -> lab/en/z",
    ]);
  });
});
