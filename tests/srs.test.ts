import { beforeEach, describe, expect, it } from "vitest";

const mem = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  value: { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) } },
  configurable: true,
});

describe("répétition espacée (Leitner)", () => {
  beforeEach(async () => {
    mem.clear();
    const s = await import("../src/lib/store");
    s.resetAll();
  });
  it("monte de boîte sur bonne réponse et retombe en boîte 1 sur erreur", async () => {
    const s = await import("../src/lib/store");
    s.recordResult("X", 1);
    s.recordResult("X", 1);
    expect(s.getSnapshot().progress.X.box).toBe(3);
    s.recordResult("X", 0);
    const p = s.getSnapshot().progress.X;
    expect(p.box).toBe(1);
    expect(p.review).toBe(true);
  });
  it("une réponse partielle ne change pas la boîte", async () => {
    const s = await import("../src/lib/store");
    s.recordResult("Y", 0.5);
    expect(s.getSnapshot().progress.Y.box).toBe(1);
  });
  it("priorise les items faibles sur les maîtrisés", async () => {
    const s = await import("../src/lib/store");
    const { priority } = await import("../src/lib/stats");
    const item = { id: "Z" } as never;
    const weak = { seen: 4, good: 0, wrong: 4, box: 1, last: 0, due: 0, review: true };
    const strong = { seen: 4, good: 4, wrong: 0, box: 5, last: 0, due: Date.now() + 1e9, mastered: true };
    expect(priority(item, weak, Date.now())).toBeGreaterThan(priority(item, strong, Date.now()));
    expect(s).toBeDefined();
  });
});
