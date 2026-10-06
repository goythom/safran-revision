"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnswerBody, Meta, Source } from "@/components/ItemBody";
import { Button, Card, cx } from "@/components/ui";
import { GROUPS, ITEMS, KIND_LABEL, LEVEL_LABEL } from "@/lib/content";
import { useAppState } from "@/lib/hooks";
import { isMastered } from "@/lib/stats";
import { toggleFlag } from "@/lib/store";
import type { Item, Kind } from "@/lib/types";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function Library() {
  const params = useSearchParams();
  const state = useAppState();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("");
  const [group, setGroup] = useState<string>(params.get("group") ?? "");
  const [level, setLevel] = useState<string>("");
  const [flag, setFlag] = useState<string>("");
  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return ITEMS.filter((it) => {
      const p = state.progress[it.id];
      if (kind && it.kind !== kind) return false;
      if (group && it.group !== group) return false;
      if (level && String(it.level) !== level) return false;
      if (flag === "fav" && !p?.fav) return false;
      if (flag === "review" && !p?.review) return false;
      if (flag === "mastered" && !isMastered(p)) return false;
      if (flag === "todo" && isMastered(p)) return false;
      if (flag === "unverified" && !it.unverified) return false;
      if (nq) {
        const hay = norm([it.question, it.answer, it.explanation, it.theme, it.id, ...(it.options ?? [])].join(" "));
        if (!nq.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
  }, [q, kind, group, level, flag, state.progress]);

  const sel = "rounded-xl border border-line bg-surface px-3 py-2 text-sm";
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Bibliothèque</h1>
        <p className="text-muted">Recherche, filtre et lis toutes les notions. Marque-les favorites, maîtrisées ou à revoir.</p>
      </header>
      <Card className="space-y-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setLimit(30); }}
          placeholder="Rechercher (ex : IGB, couple, rapport de réduction, Q-A4...)"
          aria-label="Recherche"
          className="w-full rounded-xl border border-line bg-bg px-4 py-2.5"
        />
        <div className="flex flex-wrap gap-2">
          <select aria-label="Type" className={sel} value={kind} onChange={(e) => { setKind(e.target.value); setLimit(30); }}>
            <option value="">Tous les types</option>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
          <select aria-label="Chapitre" className={sel} value={group} onChange={(e) => { setGroup(e.target.value); setLimit(30); }}>
            <option value="">Tous les chapitres</option>
            {GROUPS.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select aria-label="Niveau" className={sel} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Tous niveaux</option>
            {[1, 2, 3].map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
          <select aria-label="Statut" className={sel} value={flag} onChange={(e) => setFlag(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="fav">★ Favoris</option>
            <option value="review">À revoir</option>
            <option value="mastered">Maîtrisées</option>
            <option value="todo">Pas encore maîtrisées</option>
            <option value="unverified">À vérifier (XX / déduit)</option>
          </select>
        </div>
        <p className="text-sm text-muted" aria-live="polite">{list.length} résultat{list.length > 1 ? "s" : ""}</p>
      </Card>

      <ul className="space-y-3">
        {list.slice(0, limit).map((it) => (
          <Row key={it.id} it={it} open={open === it.id} onToggle={() => setOpen(open === it.id ? null : it.id)} />
        ))}
      </ul>
      {list.length > limit && (
        <div className="text-center"><Button variant="ghost" onClick={() => setLimit(limit + 30)}>Afficher plus</Button></div>
      )}
      {list.length === 0 && <Card><p className="text-muted">Aucun résultat. Essaie moins de filtres.</p></Card>}
    </div>
  );
}

function Row({ it, open, onToggle }: { it: Item; open: boolean; onToggle: () => void }) {
  const state = useAppState();
  const p = state.progress[it.id];
  const chip = (on: boolean) => cx("rounded-lg border px-2.5 py-1 text-xs font-medium", on ? "border-brand bg-brand/10 text-brand" : "border-line");
  return (
    <li>
      <Card className="p-4">
        <button onClick={onToggle} aria-expanded={open} className="block w-full text-left">
          <div className="mb-2"><Meta item={it} /></div>
          <p className="font-medium">{it.question}</p>
        </button>
        {open && (
          <div className="mt-3 border-t border-line pt-3">
            {it.options && (
              <ol className="mb-2 list-[upper-alpha] pl-6 text-sm text-muted">
                {it.options.map((o, i) => <li key={i} className={i === it.correct ? "font-semibold text-emerald-600" : ""}>{o}</li>)}
              </ol>
            )}
            <AnswerBody item={it} />
            <Source item={it} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className={chip(!!p?.fav)} onClick={() => toggleFlag(it.id, "fav")} aria-pressed={!!p?.fav}>★ Favori</button>
          <button className={chip(!!p?.mastered)} onClick={() => toggleFlag(it.id, "mastered")} aria-pressed={!!p?.mastered}>✓ Maîtrisée</button>
          <button className={chip(!!p?.review)} onClick={() => toggleFlag(it.id, "review")} aria-pressed={!!p?.review}>↻ À revoir</button>
          <span className="ml-auto text-xs text-muted">{it.id}{p?.seen ? ` · vue ${p.seen}×` : ""}</span>
        </div>
      </Card>
    </li>
  );
}

export default function Page() {
  return <Suspense><Library /></Suspense>;
}
