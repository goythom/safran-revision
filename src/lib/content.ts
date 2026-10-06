import raw from "@/data/content.json";
import type { Item, Kind, Mode } from "./types";

function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) % 100000) / 100000;
}

/** Les questions ouvertes deviennent des QCM: bonne réponse = réponse de la source,
 *  distracteurs = réponses d'autres questions du même chapitre (rien n'est inventé). */
/** Mauvais résultats construits à partir d'erreurs classiques (oubli de /60, unités, inverse...). NON VÉRIFIÉS par une source. */
const CALC_WRONG: Record<string, string[]> = {
  "CALC-01": ["P = 3000 kW", "P = 50 kW", "P = 18 850 kW"],
  "CALC-02": ["2000 N.m", "2041 N.m", "122,5 N.m"],
  "CALC-03": ["eta_tot = 98,3 % ; perte = 174 kW", "eta_tot = 99,4 % ; perte = 5,8 kW", "eta_tot = 98,3 % ; perte = 1,74 kW"],
  "CALC-04": ["47 MPa", "188 MPa", "12 MPa"],
  "CALC-05": ["0,17 sans unité", "58,3 sans unité", "29 290 tr/min"],
  "CALC-06": ["0,073 et 0,063 sans unité", "27 800 et 28 100 tr/min", "1,36 et 1,58 sans unité"],
  "CALC-07": ["781 kW", "8 134 kW", "426 kW"],
  "CALC-08": ["4000 N.m", "4040 N.m", "248 N.m"],
  "CALC-09": ["3 (planétaire) ; 4 (étoile) sans unité", "3 (planétaire) ; 3 (étoile) sans unité", "4 (planétaire) ; 4 (étoile) sans unité"],
  "CALC-10": ["1100 kW", "11 kW", "21 890 kW"],
  "CALC-11": ["0,12 sans unité", "83,3 sans unité", "8360 tr/min"],
  "CALC-12": ["7 sans unité", "0,083 sans unité", "3,56 sans unité"],
  "CALC-13": ["C_in = 796 N.m ; n_out = 4000 tr/min ; C_out = 265 N.m", "C_in = 796 N.m ; n_out = 36 000 tr/min ; C_out = 2387 N.m", "C_in = 83,3 N.m ; n_out = 4000 tr/min ; C_out = 250 N.m"],
  "CALC-14": ["8842 N", "6436 N", "1768 N"],
  "CALC-15": ["v = 113 m/s ; perte = 10 kW", "v = 56,5 m/s ; perte = 990 kW", "v = 56,5 m/s ; perte = 100 kW"],
};

function shuffled<T>(arr: T[], rnd: () => number): T[] {
  return [...arr].sort(() => rnd() - 0.5);
}

function toChoice(all: Item[]): Item[] {
  const cases = all.filter((i) => i.kind === "case" && i.answer);
  const opens = all.filter((i) => i.kind === "open" && i.answer);
  return all.map((it) => {
    if (it.kind === "calc" && CALC_WRONG[it.id] && it.result) {
      const rnd = seeded(it.id);
      const options = shuffled([...CALC_WRONG[it.id], it.result], rnd);
      const expl = [it.formula && `Formule : ${it.formula}`, it.steps && `Calcul : ${it.steps}`, it.explanation].filter(Boolean).join("\n");
      return { ...it, kind: "qcm" as Kind, origKind: "calc" as Kind, autoOptions: true, options, correct: options.indexOf(it.result), explanation: expl, unverified: true, reasons: Array.from(new Set([...(it.reasons ?? []), "choix construits"])) };
    }
    if (it.kind === "case" && it.answer) {
      const rnd = seeded(it.id);
      const others = shuffled(cases.filter((o) => o.id !== it.id && o.answer !== it.answer), rnd).slice(0, 3).map((o) => o.answer!);
      const options = shuffled([...others, it.answer], rnd);
      const expl = [it.keyPoints && `Points clés : ${it.keyPoints}`, it.pitfalls && `Pièges : ${it.pitfalls}`, it.followUps && `Relances : ${it.followUps}`].filter(Boolean).join("\n");
      return { ...it, kind: "qcm" as Kind, origKind: "case" as Kind, autoOptions: true, options, correct: options.indexOf(it.answer), explanation: expl };
    }
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
    desc: "Calculs de pré-dimensionnement et cas d'entretien, en choix multiples avec étapes détaillées.",
    kinds: ["qcm"],
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
    kinds: ["qcm"],
    defaultCount: 8,
    timed: 90,
    feedback: true,
  },
};

/** Préfixe le chemin des fichiers statiques (utile sous GitHub Pages). */
export const asset = (p: string) => (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + p;
