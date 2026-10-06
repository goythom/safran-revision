import type { AppState, HistoryEntry, Progress } from "./types";

const KEY = "safran-revision-v1";
const EMPTY: AppState = { progress: {}, history: [] };
let state: AppState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as AppState) };
  } catch {
    state = EMPTY;
  }
}

function commit(next: AppState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const getSnapshot = (): AppState => {
  load();
  return state;
};
export const getServerSnapshot = (): AppState => EMPTY;

const DAY = 86_400_000;
export const BOX_DAYS = [0, 0, 1, 3, 7, 21];

const blank = (): Progress => ({
  seen: 0,
  good: 0,
  wrong: 0,
  box: 1,
  last: 0,
  due: 0,
});

/** result: 1 = savait, 0.5 = partiel, 0 = à revoir */
export function recordResult(id: string, result: 0 | 0.5 | 1) {
  const p = { ...(state.progress[id] ?? blank()) };
  const now = Date.now();
  p.seen += 1;
  p.last = now;
  if (result === 1) {
    p.good += 1;
    p.box = Math.min(5, p.box + 1);
  } else if (result === 0.5) {
    p.good += 0.5;
    p.wrong += 0.5;
  } else {
    p.wrong += 1;
    p.box = 1;
    p.review = true;
  }
  p.due = now + BOX_DAYS[p.box] * DAY;
  commit({ ...state, progress: { ...state.progress, [id]: p } });
}

export function toggleFlag(id: string, flag: "fav" | "mastered" | "review") {
  const p = { ...(state.progress[id] ?? blank()) };
  p[flag] = !p[flag];
  if (flag === "mastered" && p.mastered) p.review = false;
  if (flag === "review" && p.review) p.mastered = false;
  commit({ ...state, progress: { ...state.progress, [id]: p } });
}

export function addHistory(h: HistoryEntry) {
  commit({ ...state, history: [...state.history, h].slice(-300) });
}

export function resetAll() {
  commit({ progress: {}, history: [] });
}

export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): boolean {
  try {
    const parsed = JSON.parse(text) as AppState;
    if (!parsed.progress || !Array.isArray(parsed.history)) return false;
    commit({ progress: parsed.progress, history: parsed.history });
    return true;
  } catch {
    return false;
  }
}
