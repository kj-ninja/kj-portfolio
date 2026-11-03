import type { Loader, LoaderContext } from "astro/loaders";
import { describe, expect, it } from "vitest";
import { requirePolishForReady } from "./loaders";

function contextWith(entries: Record<string, { status: string; order?: number }>): LoaderContext {
  const map = new Map(Object.entries(entries).map(([id, data]) => [id, { id, data }]));
  const store = {
    get: (key: string) => map.get(key),
    entries: () => [...map.entries()],
    has: (key: string) => map.has(key),
  };
  // Only the members `requirePolishForReady` touches are provided.
  return { collection: "lab", store } as unknown as LoaderContext;
}

const inner: Loader = { name: "fake", load: async () => {} };

describe("requirePolishForReady", () => {
  it("passes when every ready English entry has a Polish file", async () => {
    const ctx = contextWith({
      "en/cache": { status: "ready" },
      "pl/cache": { status: "ready" },
      "en/loop": { status: "building" },
    });
    await expect(requirePolishForReady(inner).load(ctx)).resolves.toBeUndefined();
  });

  it("fails naming the entry when a ready English entry has no Polish file", async () => {
    const ctx = contextWith({ "en/cache": { status: "ready" }, "en/loop": { status: "building" } });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/en\/cache/);
  });

  it("fails on a Polish orphan and says English is mandatory", async () => {
    const ctx = contextWith({ "pl/ghost": { status: "building" } });
    const p = requirePolishForReady(inner).load(ctx);
    await expect(p).rejects.toThrow(/pl\/ghost/);
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/English is mandatory/);
  });

  it("names every ready entry without Polish in one message", async () => {
    const ctx = contextWith({ "en/a": { status: "ready" }, "en/b": { status: "ready" }, "en/c": { status: "ready" } });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/en\/a.*en\/b.*en\/c/);
  });

  it("lists both kinds of problems in one error", async () => {
    const ctx = contextWith({ "en/a": { status: "ready" }, "pl/ghost": { status: "building" } });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/en\/a[\s\S]*pl\/ghost/);
  });

  it("passes a planned English entry without Polish", async () => {
    const ctx = contextWith({ "en/later": { status: "planned" } });
    await expect(requirePolishForReady(inner).load(ctx)).resolves.toBeUndefined();
  });

  it("fails naming the slug when EN and PL disagree on status", async () => {
    const ctx = contextWith({
      "en/cache": { status: "ready", order: 1 },
      "pl/cache": { status: "building", order: 1 },
    });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/cache.*status.*"ready".*"building"/);
  });

  it("fails naming the slug when EN and PL disagree on order", async () => {
    const ctx = contextWith({
      "en/loop": { status: "building", order: 3 },
      "pl/loop": { status: "building", order: 4 },
    });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/loop.*order.*3.*4/);
  });

  it("passes when EN and PL agree on status and order", async () => {
    const ctx = contextWith({
      "en/cache": { status: "ready", order: 1 },
      "pl/cache": { status: "ready", order: 1 },
      "en/loop": { status: "building", order: 2 },
      "pl/loop": { status: "building", order: 2 },
    });
    await expect(requirePolishForReady(inner).load(ctx)).resolves.toBeUndefined();
  });

  it("lists every mismatch in the same error as the other problems", async () => {
    const ctx = contextWith({
      "en/a": { status: "ready", order: 1 },
      "en/b": { status: "building", order: 2 },
      "pl/b": { status: "building", order: 5 },
      "en/c": { status: "building", order: 3 },
      "pl/c": { status: "planned", order: 3 },
    });
    await expect(requirePolishForReady(inner).load(ctx)).rejects.toThrow(/en\/a[\s\S]*b \(order[\s\S]*c \(status/);
  });

  it("runs the wrapped loader first", async () => {
    let called = false;
    const spy: Loader = {
      name: "spy",
      load: async () => {
        called = true;
      },
    };
    await requirePolishForReady(spy).load(contextWith({}));
    expect(called).toBe(true);
  });
});
