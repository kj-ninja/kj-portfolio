import { describe, expect, it } from "vitest";
import { labBase, noteBase, refineLab, workSchema } from "./schemas";

const lab = labBase.superRefine(refineLab);

const ready = {
  title: "Client-side cache",
  question: "Why does one screen fetch the same data five times?",
  order: 1,
  status: "ready",
  publishedOn: "2026-11-20",
  takeWrittenOn: "2026-11-21",
  readingMinutes: 6,
  sources: [{ title: "TanStack Query docs", url: "https://tanstack.com/query/latest" }],
};

describe("lab schema", () => {
  it("accepts a complete ready entry", () => {
    expect(lab.safeParse(ready).success).toBe(true);
  });

  it("rejects a ready entry without takeWrittenOn", () => {
    const { takeWrittenOn: _, ...noTake } = ready;
    const result = lab.safeParse(noTake);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("takeWrittenOn");
  });

  it("rejects a ready entry without publishedOn or sources", () => {
    expect(lab.safeParse({ ...ready, publishedOn: undefined }).success).toBe(false);
    expect(lab.safeParse({ ...ready, sources: [] }).success).toBe(false);
  });

  it("accepts a building entry with only title, question, order, readingMinutes", () => {
    const result = lab.safeParse({
      title: "Event loop",
      question: "In what order?",
      order: 3,
      status: "building",
      readingMinutes: 5,
    });
    expect(result.success).toBe(true);
    expect(result.data?.sandbox).toBe("island");
    expect(result.data?.sources).toEqual([]);
  });

  it("rejects a non-positive order and a bad source url", () => {
    expect(lab.safeParse({ ...ready, order: 0 }).success).toBe(false);
    expect(lab.safeParse({ ...ready, sources: [{ title: "x", url: "not a url" }] }).success).toBe(false);
  });
});

describe("notes and work schemas", () => {
  it("note needs title, summary and publishedOn", () => {
    expect(noteBase.safeParse({ title: "A", summary: "B", publishedOn: "2026-10-31" }).success).toBe(true);
    expect(noteBase.safeParse({ title: "A", summary: "B" }).success).toBe(false);
  });

  it("work item has bilingual `what` and a known status", () => {
    const ok = {
      id: "forge",
      name: "Forge",
      what: { en: "Training journal", pl: "Dziennik treningowy" },
      status: "live",
    };
    expect(workSchema.safeParse(ok).success).toBe(true);
    expect(workSchema.safeParse({ ...ok, status: "beta" }).success).toBe(false);
    expect(workSchema.safeParse({ ...ok, what: { en: "only" } }).success).toBe(false);
  });
});
