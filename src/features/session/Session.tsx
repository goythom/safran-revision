"use client";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { BOX_DAYS } from "@/lib/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnswerBody, Figure, Meta, Source } from "@/components/ItemBody";
import { ModeIcon } from "@/components/icons";
import { Badge, Button, Card, Progress, cx, pct } from "@/components/ui";
import { GROUPS, MODES } from "@/lib/content";
import { useAppState } from "@/lib/hooks";
import { addHistory, recordResult, toggleFlag } from "@/lib/store";
import type { Item, Mode } from "@/lib/types";
import { build, fromIds, pool, type Config, type Prepared } from "./engine";

type Phase = "setup" | "run" | "summary";
interface Answer {
  score: 0 | 0.5 | 1;
  chosen?: number | boolean;
  timedOut?: boolean;
}

const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.floor(s) % 60)).padStart(2, "0")}`;

export default function Session({
  mode,
  presetIds,
  reviewOnly,
}: {
  mode: Mode;
  presetIds?: string[];
  reviewOnly: boolean;
}) {
  const meta = MODES[mode];
  const state = useAppState();
  const [phase, setPhase] = useState<Phase>("setup");
  const [cfg, setCfg] = useState<Config>({
    groups: [],
    level: 0,
    count: meta.defaultCount,
    favOnly: false,
    reviewOnly,
    skipUnverified: false,
  });
  const [queue, setQueue] = useState<Prepared[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [pending, setPending] = useState<number | null>(null);

  const cur = queue[idx];
  const available = pool(mode, cfg, state).length;

  function start(prepared: Prepared[]) {
    if (!prepared.length) return;
    const t = Date.now();
    setQueue(prepared);
    setIdx(0);
    setAnswers({});
    setRevealed(false);
    setPending(null);
    setStartedAt(t);
    setNow(t);
    setDeadline(meta.total ? t + meta.total * 1000 : meta.timed ? t + meta.timed * 1000 : null);
    setPhase("run");
  }

  const finish = useCallback(
    (ans: Record<string, Answer>, q: Prepared[], t0: number) => {
      const secs = Math.round((Date.now() - t0) / 1000);
      if (!meta.feedback) {
        for (const p of q) recordResult(p.item.id, ans[p.item.id]?.score ?? 0);
      }
      const score = q.reduce((s, p) => s + (ans[p.item.id]?.score ?? 0), 0);
      addHistory({ ts: Date.now(), mode, total: q.length, score, seconds: secs, groups: [...new Set(q.map((p) => p.item.group))].slice(0, 6) });
      setSeconds(secs);
      setPhase("summary");
    },
    [meta.feedback, mode],
  );

  const answer = useCallback(
    (a: Answer) => {
      if (!cur) return;
      setAnswers((prev) => ({ ...prev, [cur.item.id]: a }));
      if (meta.feedback) recordResult(cur.item.id, a.score);
      setRevealed(true);
    },
    [cur, meta.feedback],
  );

  const next = useCallback(() => {
    if (idx + 1 >= queue.length) {
      finish(answers, queue, startedAt);
      return;
    }
    setIdx(idx + 1);
    setRevealed(false);
    setPending(null);
    if (meta.timed && !meta.total) setDeadline(Date.now() + meta.timed * 1000);
  }, [idx, queue, answers, startedAt, finish, meta.timed, meta.total]);

  const prev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  // clock
  const live = useRef({ phase, revealed, deadline, answer, finish, answers, queue, startedAt, cur });
  useEffect(() => {
    live.current = { phase, revealed, deadline, answer, finish, answers, queue, startedAt, cur };
  });
  useEffect(() => {
    if (phase !== "run" || !deadline) return;
    const id = setInterval(() => {
      const L = live.current;
      const t = Date.now();
      setNow(t);
      if (!L.deadline || t < L.deadline) return;
      if (meta.total) {
        L.finish(L.answers, L.queue, L.startedAt);
      } else if (!L.revealed && L.cur) {
        const k = L.cur.item.kind;
        if (k === "qcm" || k === "vf") L.answer({ score: 0, timedOut: true });
        else setRevealed(true); // interview: time's up, show the model answer
        setDeadline(null);
      }
    }, 400);
    return () => clearInterval(id);
  }, [phase, deadline, meta.total]);

  // keyboard
  useEffect(() => {
    if (phase !== "run" || !cur) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key;
      const kind = cur.item.kind;
      const choice = kind === "qcm" || kind === "vf";
      if (choice && (!revealed || !meta.feedback)) {
        const n = kind === "vf" ? 2 : cur.order?.length ?? 4;
        const d = k >= "1" && k <= String(n) ? Number(k) - 1 : "abcd".indexOf(k.toLowerCase());
        if (d >= 0 && d < n) {
          e.preventDefault();
          pick(d);
          return;
        }
      }
      if (k === "Enter" && !revealed && meta.feedback && needsValidate(cur.item) && pending !== null) {
        e.preventDefault();
        validate();
        return;
      }
      if (k === "Enter" && (revealed || !meta.feedback)) {
        e.preventDefault();
        next();
      }
      if (!choice) {
        if ((k === " " || k === "Enter") && !revealed) {
          e.preventDefault();
          setRevealed(true);
        } else if (revealed) {
          if (k === "1") answer({ score: 1 });
          if (k === "2") answer({ score: 0.5 });
          if (k === "3") answer({ score: 0 });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const needsValidate = (it: Item) => it.kind === "qcm" && meta.feedback && !meta.timed;

  function validate() {
    if (!cur || pending === null) return;
    const it = cur.item;
    answer({ score: pending === it.correct ? 1 : 0, chosen: pending });
  }

  function pick(display: number) {
    if (!cur) return;
    const it = cur.item;
    if (meta.feedback && revealed) return;
    if (it.kind === "qcm") {
      const orig = cur.order ? cur.order[display] : display;
      if (needsValidate(it)) {
        setPending(orig);
        return;
      }
      answer({ score: orig === it.correct ? 1 : 0, chosen: orig });
    } else {
      const val = display === 0; // 0 = Vrai
      answer({ score: val === it.correct ? 1 : 0, chosen: val });
    }
    if (!meta.feedback) setRevealed(false);
  }

  // ---------- SETUP ----------
  if (phase === "setup") {
    const toggleGroup = (g: string) =>
      setCfg((c) => ({ ...c, groups: c.groups.includes(g) ? c.groups.filter((x) => x !== g) : [...c.groups, g] }));
    const groupsForMode = GROUPS.filter((g) => pool(mode, { ...cfg, groups: [] }, state).some((i) => i.group === g));
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <header>
          <p className="text-sm text-muted"><Link href="/" className="underline">Tableau de bord</Link> / {meta.label}</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ModeIcon mode={mode} className="h-6 w-6 text-brand" /> {meta.label}</h1>
          <p className="text-muted">{meta.desc}</p>
        </header>
        {presetIds ? (
          <Card>
            <p className="mb-3">{presetIds.length} question(s) sélectionnée(s).</p>
            <Button onClick={() => start(fromIds(presetIds))}>Commencer</Button>
          </Card>
        ) : (
          <Card className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold">Chapitres <span className="font-normal text-muted">(aucun = tous)</span></p>
              <div className="flex flex-wrap gap-1.5">
                {groupsForMode.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGroup(g)}
                    aria-pressed={cfg.groups.includes(g)}
                    className={cx("rounded-2xl border px-3 py-1 text-xs", cfg.groups.includes(g) ? "border-brand bg-brand-soft text-brand" : "border-line")}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Niveau</span>
                <select className="w-full rounded-2xl border border-line bg-bg px-3 py-2" value={cfg.level} onChange={(e) => setCfg({ ...cfg, level: Number(e.target.value) })}>
                  <option value={0}>Tous</option>
                  <option value={1}>Débutant</option>
                  <option value={2}>Intermédiaire</option>
                  <option value={3}>Avancé</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-semibold">Nombre de questions : {Math.min(cfg.count, available)}</span>
                <input type="range" min={5} max={Math.max(5, Math.min(60, available))} step={1} value={Math.min(cfg.count, Math.max(5, available))} onChange={(e) => setCfg({ ...cfg, count: Number(e.target.value) })} className="w-full" />
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {([
                ["favOnly", "Favoris seulement"],
                ["reviewOnly", "À revoir seulement"],
                ["skipUnverified", "Exclure les notions à vérifier (XX / déduit)"],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2">
                  <input type="checkbox" checked={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.checked })} /> {label}
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">{available} question(s) disponible(s)</p>
              <Button disabled={available === 0} onClick={() => start(build(mode, { ...cfg, count: Math.min(cfg.count, available) }, state))}>
                Commencer
              </Button>
            </div>
            {available === 0 && <p className="text-sm text-warn">Aucune question avec ces filtres.</p>}
          </Card>
        )}
      </div>
    );
  }

  // ---------- SUMMARY ----------
  if (phase === "summary") {
    const total = queue.length;
    const score = queue.reduce((s, p) => s + (answers[p.item.id]?.score ?? 0), 0);
    const missed = queue.filter((p) => (answers[p.item.id]?.score ?? 0) < 1);
    const byG: Record<string, { n: number; s: number }> = {};
    for (const p of queue) {
      const g = (byG[p.item.group] ??= { n: 0, s: 0 });
      g.n++;
      g.s += answers[p.item.id]?.score ?? 0;
    }
    const ratio = score / total;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Card className="text-center">
          <p className="text-sm font-semibold text-muted">{meta.label} terminé en {fmt(seconds)}</p>
          <p className="my-3 text-[72px] font-extrabold leading-[76px]">{score % 1 ? score.toFixed(1) : score}<span className="text-3xl text-muted"> / {total}</span></p>
          <Badge tone={ratio >= 0.7 ? "green" : ratio >= 0.4 ? "amber" : "red"}>{pct(ratio)}</Badge>
          <p className="mt-3 text-sm text-muted">
            {ratio >= 0.8 ? "Solide. Passe à un niveau supérieur ou à l'examen." : ratio >= 0.5 ? "Correct. Refais les erreurs pour les fixer." : "Pas encore. Relis la correction puis refais les erreurs."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {missed.length > 0 && (
              <Button onClick={() => start(fromIds(missed.map((m) => m.item.id)))}>Refaire les {missed.length} erreurs</Button>
            )}
            <Button variant="ghost" onClick={() => setPhase("setup")}>Nouvelle session</Button>
            <Link href="/"><Button variant="ghost">Tableau de bord</Button></Link>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Par chapitre</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(byG).map(([g, v]) => (
              <li key={g}>
                <div className="mb-1 flex justify-between"><span>{g}</span><span className="text-muted">{v.s}/{v.n}</span></div>
                <Progress value={(v.s / v.n) * 100} tone="green" />
              </li>
            ))}
          </ul>
        </Card>
        {missed.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Correction des erreurs</h2>
            {missed.map((p) => (
              <Card key={p.item.id}>
                <Meta item={p.item} />
                <p className="mt-2 font-medium">{p.item.question}</p>
                {answers[p.item.id]?.chosen !== undefined && p.item.kind === "qcm" && (
                  <p className="mt-1 text-sm text-bad">Ta réponse : {p.item.options?.[answers[p.item.id].chosen as number]}</p>
                )}
                {answers[p.item.id]?.timedOut && <p className="mt-1 text-sm text-bad">Temps écoulé.</p>}
                <div className="mt-2 rounded-2xl bg-ok-soft p-3"><AnswerBody item={p.item} /></div>
                <Source item={p.item} />
              </Card>
            ))}
          </section>
        )}
      </div>
    );
  }

  // ---------- RUN ----------
  if (!cur) return null;
  const it = cur.item;
  const choice = it.kind === "qcm" || it.kind === "vf";
  const ans = answers[it.id];
  const timeLeft = deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
  const flags = state.progress[it.id];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium"><ModeIcon mode={mode} /> {meta.label} · {idx + 1}/{queue.length}</span>
            {timeLeft !== null && (
              <span className={cx("font-mono font-semibold", timeLeft <= 5 && "text-bad")} aria-live="off">
                {meta.total ? fmt(timeLeft) : `${timeLeft}s`}
              </span>
            )}
          </div>
          <Progress value={((meta.feedback ? idx + (revealed ? 1 : 0) : answeredCount) / queue.length) * 100} />
        </div>
        <Button variant="ghost" onClick={() => confirm("Quitter la session ? Les réponses déjà données sont conservées.") && finish(answers, queue, startedAt)}>Terminer</Button>
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <Meta item={it} />
          <div className="flex shrink-0 gap-1">
            <button aria-label="Favori" aria-pressed={!!flags?.fav} onClick={() => toggleFlag(it.id, "fav")} className={cx("rounded-2xl border border-line px-2 py-1 text-sm", flags?.fav && "bg-safran-sand/30")}>★</button>
            <button aria-label="Marquer à revoir" aria-pressed={!!flags?.review} onClick={() => toggleFlag(it.id, "review")} className={cx("rounded-2xl border border-line px-2 py-1 text-sm", flags?.review && "bg-bad/20")}>↻</button>
            <button aria-label="Marquer maîtrisée" aria-pressed={!!flags?.mastered} onClick={() => toggleFlag(it.id, "mastered")} className={cx("rounded-2xl border border-line px-2 py-1 text-sm", flags?.mastered && "bg-ok/20")}>✓</button>
          </div>
        </div>

        {it.kind === "flashcard" || it.kind === "assoc" ? (
          <div className="flip">
            <div className={cx("flip-inner min-h-56", revealed && "flipped")}>
              <button
                onClick={() => setRevealed(true)}
                aria-hidden={revealed}
                tabIndex={revealed ? -1 : 0}
                className="flip-face flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-line bg-surface p-6 text-center"
              >
                <span className="text-xs uppercase tracking-wide text-muted">{it.kind === "assoc" ? "Terme" : "Question"}</span>
                <span className="mt-2 text-xl font-semibold">{it.question}</span>
                <span className="mt-4 text-xs text-muted">Touche pour retourner (Espace)</span>
              </button>
              <div className="flip-face flip-back flex min-h-56 flex-col items-center justify-center overflow-auto rounded-2xl border-2 border-brand bg-brand-soft p-6 text-center" aria-hidden={!revealed}>
                <span className="text-sm font-bold uppercase tracking-wide text-brand">Réponse</span>
                <div className="mt-2 text-[22px] font-semibold leading-8"><AnswerBody item={it} /></div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[22px] font-bold leading-8 md:text-[26px] md:leading-9">{it.question}</p>
        )}

        {it.kind === "qcm" && cur.order && (
          <>
            <ul className="space-y-2" role="radiogroup" aria-label="Réponses">
              {cur.order.map((orig, d) => {
                const showFb = meta.feedback && revealed;
                const chosen = showFb || !meta.feedback ? ans?.chosen === orig : (pending ?? ans?.chosen) === orig;
                const good = orig === it.correct;
                return (
                  <li key={orig}>
                    <button
                      role="radio"
                      aria-checked={chosen}
                      disabled={showFb}
                      onClick={() => pick(d)}
                      className={cx(
                        "opt flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left text-[17px] font-medium",
                        !showFb && !chosen && "border-line hover:border-brand",
                        !showFb && chosen && "border-brand bg-brand-soft",
                        showFb && good && "pop border-ok bg-ok-soft",
                        showFb && chosen && !good && "shake border-bad bg-bad-soft",
                        showFb && !chosen && !good && "border-line opacity-70",
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-line text-sm font-bold">
                        {showFb && good ? <Check className="h-4 w-4 text-ok" aria-label="Bonne réponse" /> : showFb && chosen ? <X className="h-4 w-4 text-bad" aria-label="Mauvaise réponse" /> : "ABCD"[d]}
                      </span>
                      <span className="pt-0.5">{it.options?.[orig]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {needsValidate(it) && !revealed && (
              <Button className="w-full" disabled={pending === null} onClick={validate}>
                Valider ma réponse
              </Button>
            )}
          </>
        )}

        {it.kind === "vf" && (
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Vrai ou faux">
            {[true, false].map((v, d) => {
              const chosen = ans?.chosen === v;
              const showFb = meta.feedback && revealed;
              const good = v === it.correct;
              return (
                <button
                  key={String(v)}
                  role="radio"
                  aria-checked={chosen}
                  disabled={showFb}
                  onClick={() => pick(d)}
                  className={cx(
                    "opt min-h-14 rounded-2xl border-2 p-4 text-lg font-bold",
                    !showFb && !chosen && "border-line hover:border-brand",
                    !showFb && chosen && "border-brand bg-brand-soft",
                    showFb && good && "pop border-ok bg-ok-soft",
                    showFb && chosen && !good && "shake border-bad bg-bad-soft",
                  )}
                >
                  {showFb && good ? <Check className="mr-1 inline h-5 w-5 text-ok" aria-hidden /> : showFb && chosen ? <X className="mr-1 inline h-5 w-5 text-bad" aria-hidden /> : null}
                  {v ? "Vrai" : "Faux"}
                </button>
              );
            })}
          </div>
        )}

        {/* feedback for choice questions */}
        {choice && meta.feedback && revealed && (
          <div className={cx("rounded-2xl p-4 text-base", ans?.score === 1 ? "bg-ok-soft" : "bg-bad-soft")} aria-live="polite">
            <p className="mb-1 font-semibold">{ans?.timedOut ? "Temps écoulé." : ans?.score === 1 ? "Bonne réponse." : "Mauvaise réponse."}</p>
            {it.kind === "vf" ? <p className="font-medium">{it.correct ? "Vrai" : "Faux"}</p> : null}
            {it.explanation && <p className="whitespace-pre-line">{it.explanation}</p>}
            <Source item={it} />
          </div>
        )}

        {/* self-graded kinds */}
        {!choice && it.kind !== "flashcard" && it.kind !== "assoc" && (
          <>
            {!revealed ? (
              <div className="space-y-2">
                {it.kind === "case" || mode === "interview" ? (
                  <p className="text-sm text-muted">Réponds à voix haute comme en entretien, puis affiche la réponse modèle.</p>
                ) : (
                  <p className="text-sm text-muted">Fais le calcul sur papier, puis affiche le résultat et compare.</p>
                )}
                <Button onClick={() => setRevealed(true)}>Afficher la réponse (Espace)</Button>
              </div>
            ) : (
              <div className="rounded-2xl bg-brand-soft p-4"><AnswerBody item={it} /><Source item={it} /></div>
            )}
          </>
        )}
        {(it.kind === "flashcard" || it.kind === "assoc") && !revealed && (
          <Button className="w-full" onClick={() => setRevealed(true)}>Afficher la réponse</Button>
        )}
        {revealed && meta.feedback && <Figure item={it} />}
        {(it.kind === "flashcard" || it.kind === "assoc") && revealed && <Source item={it} />}

        {/* self grade */}
        {!choice && revealed && !ans && (() => {
          const simple = it.kind === "flashcard" || it.kind === "assoc";
          const box = flags?.box ?? 1;
          const goodDays = BOX_DAYS[Math.min(5, box + 1)];
          const label = (d: number) => (d === 0 ? "aujourd'hui" : d === 1 ? "demain" : `dans ${d} j`);
          return (
            <div>
              <p className="mb-2 text-base font-semibold">Tu savais ?</p>
              <div className={cx("grid gap-2", simple ? "grid-cols-2" : "grid-cols-3")}>
                <Button variant="bad" onClick={() => answer({ score: 0 })} className="flex-col gap-0 py-2">
                  <span>{simple ? "Je ne savais pas" : "Non"}</span>
                  <span className="text-sm font-normal opacity-90">revient aujourd&apos;hui</span>
                </Button>
                {!simple && <Button variant="warn" onClick={() => answer({ score: 0.5 })}>En partie</Button>}
                <Button variant="good" onClick={() => answer({ score: 1 })} className="flex-col gap-0 py-2">
                  <span>{simple ? "Je savais" : "Oui"}</span>
                  <span className="text-sm font-normal opacity-90">{label(goodDays)}</span>
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted">Raccourcis : 1 oui, {simple ? "3" : "2 en partie, 3"} non</p>
            </div>
          );
        })()}

        {/* nav */}
        <div className="flex items-center justify-between pt-2">
          {meta.feedback ? <span /> : <Button variant="ghost" onClick={prev} disabled={idx === 0}>← Précédente</Button>}
          {(!meta.feedback || ans) && (
            <Button onClick={next}>{idx + 1 >= queue.length ? "Voir le résultat" : "Suivante"} →</Button>
          )}
        </div>
      </Card>
      {!meta.feedback && <p className="text-center text-xs text-muted">Mode examen : aucune correction avant la fin. {answeredCount}/{queue.length} répondues.</p>}
    </div>
  );
}

export type { Item };
