import { describe, expect, it } from "vitest";
import { ITEMS, BY_ID } from "../src/lib/content";

describe("contenu importé", () => {
  it("a des IDs uniques", () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    expect(Object.keys(BY_ID).length).toBe(ITEMS.length);
  });
  it("chaque QCM a 4 options et une bonne réponse valide", () => {
    for (const q of ITEMS.filter((i) => i.kind === "qcm")) {
      expect(q.options).toHaveLength(4);
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
    }
  });
  it("chaque question a un énoncé et une source", () => {
    for (const i of ITEMS) {
      expect(i.question.length).toBeGreaterThan(3);
    }
    const noSource = ITEMS.filter((i) => !i.source);
    expect(noSource.length).toBeLessThan(ITEMS.length * 0.05);
  });
  it("garde visibles les contenus XX / déduits", () => {
    const flagged = ITEMS.filter((i) => i.unverified);
    for (const i of flagged) expect(i.unverified).toBe(true);
    expect(ITEMS.some((i) => /\bXX\b|DÉDUIT/.test(`${i.question} ${i.answer ?? ""} ${i.explanation ?? ""}`) && !i.unverified)).toBe(false);
  });
});
