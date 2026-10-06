import raw from "@/data/content.json";
import type { Item, Kind, Mode } from "./types";

export const ITEMS = raw.items as unknown as Item[];
export const GROUPS = raw.groups as string[];
export const BY_ID: Record<string, Item> = Object.fromEntries(
  ITEMS.map((i) => [i.id, i]),
);

export const KIND_LABEL: Record<Kind, string> = {
  open: "Question ouverte",
  qcm: "QCM",
  vf: "Vrai / Faux",
  flashcard: "Flashcard",
  assoc: "Association FR-EN",
  case: "Cas d'entretien",
  calc: "Calcul",
};

export const LEVEL_LABEL = ["", "Débutant", "Intermédiaire", "Avancé"];

export interface ModeMeta {
  label: string;
  desc: string;
  kinds: Kind[];
  defaultCount: number;
  timed?: number; // seconds per question
  total?: number; // total seconds (exam)
  feedback: boolean;
}

export const MODES: Record<Mode, ModeMeta> = {
  flashcards: {
    label: "Flashcards",
    desc: "Retourne la carte, puis dis si tu savais. Espace pour retourner, 1-2-3 pour noter.",
    kinds: ["flashcard", "assoc"],
    defaultCount: 20,
    feedback: true,
  },
  qcm: {
    label: "QCM",
    desc: "Une bonne réponse sur quatre, avec l'explication juste après.",
    kinds: ["qcm"],
    defaultCount: 15,
    feedback: true,
  },
  vf: {
    label: "Vrai / Faux",
    desc: "Affirmations rapides pour tester les pièges du rapport.",
    kinds: ["vf"],
    defaultCount: 15,
    feedback: true,
  },
  open: {
    label: "Questions ouvertes",
    desc: "Réponds à voix haute ou par écrit, compare avec la réponse attendue, puis auto-évalue.",
    kinds: ["open"],
    defaultCount: 10,
    feedback: true,
  },
  cases: {
    label: "Cas techniques",
    desc: "Calculs de pré-dimensionnement et cas d'entretien avec étapes détaillées.",
    kinds: ["calc", "case"],
    defaultCount: 8,
    feedback: true,
  },
  adaptive: {
    label: "Révision adaptative",
    desc: "L'app choisit les notions les plus faibles ou échues (boîtes de Leitner), tous formats mélangés.",
    kinds: ["flashcard", "assoc", "qcm", "vf", "open", "case", "calc"],
    defaultCount: 20,
    feedback: true,
  },
  quiz: {
    label: "Quiz chronométré",
    desc: "QCM et Vrai/Faux avec 25 secondes par question. Pas de temps, c'est faux.",
    kinds: ["qcm", "vf"],
    defaultCount: 15,
    timed: 25,
    feedback: true,
  },
  exam: {
    label: "Mode examen",
    desc: "20 questions, 30 minutes, aucune correction avant la fin. Note finale puis relecture.",
    kinds: ["qcm", "vf"],
    defaultCount: 20,
    total: 30 * 60,
    feedback: false,
  },
  interview: {
    label: "Simulation d'entretien",
    desc: "Une question orale à la fois, 90 secondes pour répondre, puis réponse modèle, pièges et relances.",
    kinds: ["case", "open"],
    defaultCount: 8,
    timed: 90,
    feedback: true,
  },
};
