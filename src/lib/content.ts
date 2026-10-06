import raw from "@/data/content.json";
import type { Item, Kind, Mode } from "./types";

function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 100000) / 100000;
}

/** Les questions ouvertes deviennent des QCM: bonne réponse = réponse de la source,
 *  distracteurs = réponses d'autres questions du même chapitre (rien n'est inventé). */
function toChoice(all: Item[]): Item[] {
  const opens = all.filter((i) => i.kind === "open" && i.answer);
  return all.map((it) => {
    if (it.kind !== "open" || !it.answer) return it;
    const rnd = seeded(it.id);
    const len = it.answer.length;
    const others = opens.filter((o) => o.id !== it.id && o.answer !== it.answer);
    const near = (o: Item, lo: number, hi: number) => o.answer!.length >= len * lo && o.answer!.length <= len * hi;
    const same = others.filter((o) => o.group === it.group);
    const tiers = [same.filter((o) => near(o, 0.5, 2)), same, others.filter((o) => near(o, 0.5, 2)), others];
    const picked: string[] = [];
    for (const t of tiers) {
      const arr = [...t].sort(() => rnd() - 0.5);
      for (const o of arr) {
        if (picked.length >= 3) break;
        if (!picked.includes(o.answer!)) picked.push(o.answer!);
      }
      if (picked.length >= 3) break;
    }
    const options = [...picked, it.answer].sort(() => rnd() - 0.5);
    return { ...it, kind: "qcm" as Kind, origKind: "open" as Kind, autoOptions: true, options, correct: options.indexOf(it.answer), explanation: undefined };
  });
}

export const ITEMS = toChoice(raw.items as unknown as Item[]);
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
    label: "Questions de compréhension",
    desc: "Les anciennes questions ouvertes, en choix multiples: choisis la bonne réponse parmi 4.",
    kinds: ["qcm"],
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
    kinds: ["case", "qcm"],
    defaultCount: 8,
    timed: 90,
    feedback: true,
  },
};

/** Préfixe le chemin des fichiers statiques (utile sous GitHub Pages). */
export const asset = (p: string) => (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + p;
