import { ITEMS, GROUPS } from "./content";
import type { AppState, Item, Progress } from "./types";

export const isMastered = (p?: Progress) =>
  !!p && (p.mastered === true || (p.box >= 4 && !p.review));

export const accuracy = (p?: Progress) =>
  p && p.seen > 0 ? p.good / p.seen : null;

export function overall(state: AppState) {
  const total = ITEMS.length;
  let mastered = 0;
  let seen = 0;
  let due = 0;
  let toReview = 0;
  let fav = 0;
  const now = Date.now();
  for (const it of ITEMS) {
    const p = state.progress[it.id];
    if (!p) continue;
    if (p.seen > 0) seen++;
    if (isMastered(p)) mastered++;
    if (p.seen > 0 && p.due <= now && !isMastered(p)) due++;
    if (p.review) toReview++;
    if (p.fav) fav++;
  }
  return { total, mastered, seen, due, toReview, fav };
}

export function byGroup(state: AppState) {
  return GROUPS.map((g) => {
    const items = ITEMS.filter((i) => i.group === g);
    let seen = 0;
    let mastered = 0;
    let good = 0;
    let attempts = 0;
    for (const it of items) {
      const p = state.progress[it.id];
      if (!p) continue;
      if (p.seen) seen++;
      if (isMastered(p)) mastered++;
      good += p.good;
      attempts += p.seen;
    }
    return {
      group: g,
      total: items.length,
      seen,
      mastered,
      accuracy: attempts ? good / attempts : null,
    };
  });
}

export function streakDays(state: AppState) {
  const days = new Set(
    state.history.map((h) => new Date(h.ts).toLocaleDateString("fr-FR")),
  );
  let n = 0;
  const d = new Date();
  if (!days.has(d.toLocaleDateString("fr-FR"))) d.setDate(d.getDate() - 1);
  while (days.has(d.toLocaleDateString("fr-FR"))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** priority used by the adaptive mode: higher = review first */
export function priority(it: Item, p: Progress | undefined, now: number) {
  let s = Math.random() * 0.4;
  if (!p || p.seen === 0) return s + 0.9;
  const acc = accuracy(p) ?? 0;
  s += (1 - acc) * 2 + (6 - p.box) / 5;
  if (p.due <= now) s += 0.8;
  if (p.review) s += 1;
  if (isMastered(p)) s -= 1.5;
  return s;
}
