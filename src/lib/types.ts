export type Kind = "open" | "qcm" | "vf" | "flashcard" | "assoc" | "case" | "calc";

export interface Item {
  id: string;
  kind: Kind;
  group: string;
  theme: string;
  level: 1 | 2 | 3;
  question: string;
  answer?: string;
  options?: string[];
  correct?: number | boolean;
  explanation?: string;
  source: string;
  unverified: boolean;
  en?: string;
  qtype?: string;
  keyPoints?: string;
  pitfalls?: string;
  followUps?: string;
  hypotheses?: string;
  formula?: string;
  steps?: string;
  result?: string;
}

export interface Progress {
  seen: number;
  good: number; // cumulative score (1 = right, 0.5 = partial)
  wrong: number;
  box: number; // Leitner box 1..5
  last: number;
  due: number;
  fav?: boolean;
  mastered?: boolean;
  review?: boolean;
}

export interface HistoryEntry {
  ts: number;
  mode: string;
  total: number;
  score: number;
  seconds: number;
  groups?: string[];
}

export interface AppState {
  progress: Record<string, Progress>;
  history: HistoryEntry[];
}

export type Mode =
  | "flashcards"
  | "qcm"
  | "vf"
  | "open"
  | "cases"
  | "adaptive"
  | "quiz"
  | "exam"
  | "interview";
