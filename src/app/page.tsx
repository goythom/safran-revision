"use client";
import Link from "next/link";
import { useRef } from "react";
import { Badge, Button, Card, Progress, pct } from "@/components/ui";
import { ModeIcon } from "@/components/icons";
import { MODES } from "@/lib/content";
import { useAppState } from "@/lib/hooks";
import { byGroup, overall, streakDays } from "@/lib/stats";
import { exportJson, importJson, resetAll } from "@/lib/store";
import type { Mode } from "@/lib/types";

const ORDER: Mode[] = ["adaptive", "flashcards", "qcm", "vf", "open", "cases", "quiz", "exam", "interview"];

export default function Dashboard() {
  const state = useAppState();
  const o = overall(state);
  const groups = byGroup(state);
  const streak = streakDays(state);
  const fileRef = useRef<HTMLInputElement>(null);
  const weak = groups
    .filter((g) => g.accuracy !== null)
    .sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1))
    .slice(0, 3);
  const last = state.history.slice(-5).reverse();
  const totalSessions = state.history.length;
  const avg = totalSessions
    ? state.history.reduce((s, h) => s + h.score / Math.max(1, h.total), 0) / totalSessions
    : null;

  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([exportJson()], { type: "application/json" }));
    a.download = "progression-safran.json";
    a.click();
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-[28px] font-semibold leading-9">Prépa entretien Safran Aircraft Engines</h1>
        <p className="text-muted">
          Ingénieur maîtrise d&apos;ouvrage et intégration des transmissions mécaniques. {o.total} questions issues de ton
          rapport et de ton questionnaire.
        </p>
      </header>

      <section aria-label="Statistiques" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Notions maîtrisées" value={`${o.mastered}/${o.total}`} sub={pct(o.mastered / o.total)} />
        <Stat label="Déjà vues" value={`${o.seen}`} sub={pct(o.seen / o.total)} />
        <Stat label="À revoir aujourd'hui" value={`${o.due + o.toReview}`} sub={`${o.toReview} marquées à revoir`} />
        <Stat label="Série" value={`${streak} j`} sub={avg === null ? "Aucune session" : `Score moyen ${pct(avg)}`} />
      </section>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Progression globale</h2>
          <span className="text-sm text-muted">{pct(o.mastered / o.total)} maîtrisé</span>
        </div>
        <Progress value={(o.mastered / o.total) * 100} tone="green" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/session/?mode=adaptive">
            <Button><ModeIcon mode="adaptive" /> Lancer la révision du jour</Button>
          </Link>
          {o.toReview > 0 && (
            <Link href="/session/?mode=adaptive&review=1">
              <Button variant="ghost">Réviser mes {o.toReview} notions à revoir</Button>
            </Link>
          )}
        </div>
      </Card>

      <section id="modes" aria-label="Modes de révision" className="scroll-mt-4">
        <h2 className="mb-3 text-lg font-semibold">Choisir un mode</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {ORDER.map((m) => (
            <Link
              key={m}
              href={`/session/?mode=${m}`}
              className="group rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(17,24,39,.06)] transition-colors duration-150 hover:border-brand"
            >
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand"><ModeIcon mode={m} /></span> {MODES[m].label}
              </div>
              <p className="hidden text-sm text-muted sm:block">{MODES[m].desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Points faibles</h2>
          {weak.length === 0 ? (
            <p className="text-sm text-muted">Fais une première session pour voir apparaître tes chapitres à renforcer.</p>
          ) : (
            <ul className="space-y-3">
              {weak.map((g) => (
                <li key={g.group}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{g.group}</span>
                    <span className="text-muted">{pct(g.accuracy ?? 0)}</span>
                  </div>
                  <Progress value={(g.accuracy ?? 0) * 100} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Dernières sessions</h2>
          {last.length === 0 ? (
            <p className="text-sm text-muted">Aucune session pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {last.map((h) => (
                <li key={h.ts} className="flex items-center justify-between py-2">
                  <span>
                    {MODES[h.mode as Mode]?.label ?? h.mode}
                    <span className="ml-2 text-muted">{new Date(h.ts).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  <Badge tone={h.score / h.total >= 0.7 ? "green" : h.score / h.total >= 0.4 ? "amber" : "red"}>
                    {h.score % 1 ? h.score.toFixed(1) : h.score}/{h.total}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-semibold">Avancement par chapitre</h2>
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.group} href={`/library/?group=${encodeURIComponent(g.group)}`} className="block rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
              <div className="mb-1 flex justify-between text-sm">
                <span>{g.group}</span>
                <span className="text-muted">{g.mastered}/{g.total}</span>
              </div>
              <Progress value={(g.mastered / g.total) * 100} tone="green" />
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 font-semibold">Mes données</h2>
        <p className="mb-3 text-sm text-muted">
          La progression reste dans ce navigateur (aucun serveur). Exporte-la pour la sauvegarder ou la changer d&apos;appareil.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={download}>Exporter</Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>Importer</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (!importJson(await f.text())) alert("Fichier invalide.");
            }}
          />
          <Button
            variant="ghost"
            onClick={() => confirm("Effacer toute la progression ?") && resetAll()}
          >
            Réinitialiser
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 tabnum text-[32px] font-semibold leading-10">{value}</p>
      <p className="text-sm text-muted">{sub}</p>
    </Card>
  );
}
