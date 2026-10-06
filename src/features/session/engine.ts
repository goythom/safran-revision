import { BY_ID, ITEMS, MODES } from "@/lib/content";
import { isMastered, priority } from "@/lib/stats";
import type { AppState, Item, Mode } from "@/lib/types";

export interface Config {
  groups: string[];
  level: number; // 0 = all
  count: number;
  favOnly: boolean;
  reviewOnly: boolean;
  skipUnverified: boolean;
}

export interface Prepared {
  item: Item;
  /** display order of options, indexes into item.options */
  order?: number[];
}

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export function pool(mode: Mode, cfg: Config, state: AppState): Item[] {
  const kinds = MODES[mode].kinds;
  return ITEMS.filter((it) => {
    if (!kinds.includes(it.kind)) return false;
    if (mode === "open" && it.origKind !== "open") return false;
    if (mode === "interview" && it.kind === "qcm" && !(it.origKind === "open" && it.group === "A13 Entretien")) return false;
    if (cfg.groups.length && !cfg.groups.includes(it.group)) return false;
    if (cfg.level && it.level !== cfg.level) return false;
    const p = state.progress[it.id];
    if (cfg.favOnly && !p?.fav) return false;
    if (cfg.reviewOnly && !p?.review) return false;
    if (cfg.skipUnverified && it.unverified) return false;
    return true;
  });
}

const FIXED = /(toutes les|aucune des|les deux|a et b|b et c)/i;

export function build(mode: Mode, cfg: Config, state: AppState): Prepared[] {
  const p = pool(mode, cfg, state);
  const now = Date.now();
  let picked: Item[];
  if (mode === "adaptive") {
    picked = [...p]
      .map((it) => ({ it, s: priority(it, state.progress[it.id], now) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, cfg.count)
      .map((x) => x.it);
    picked = shuffle(picked);
  } else {
    // favour non-mastered items first, but keep randomness
    const todo = shuffle(p.filter((it) => !isMastered(state.progress[it.id])));
    const done = shuffle(p.filter((it) => isMastered(state.progress[it.id])));
    picked = [...todo, ...done].slice(0, cfg.count);
    if (mode === "flashcards" || mode === "cases" || mode === "interview" || mode === "open") picked = shuffle(picked);
  }
  return picked.map((item) => {
    if (item.kind === "qcm" && item.options && !item.options.some((o) => FIXED.test(o))) {
      return { item, order: shuffle([0, 1, 2, 3].slice(0, item.options.length)) };
    }
    return { item, order: item.options ? item.options.map((_, i) => i) : undefined };
  });
}

export const fromIds = (ids: string[]): Prepared[] =>
  ids.filter((i) => BY_ID[i]).map((i) => {
    const item = BY_ID[i];
    return { item, order: item.options ? item.options.map((_, k) => k) : undefined };
  });
