"use client";
import Link from "next/link";
import { useRef } from "react";
import { Button, Progress, pct } from "@/components/ui";
import Gear from "@/components/Gear";
import {} from "@/components/icons";
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
    <div className="space-y-14">
      <header className="relative">
        <Gear className="pointer-events-none absolute -right-20 -top-8 -z-0 h-[300px] w-[300px] text-brand opacity-[0.2] md:right-0 md:top-0 md:h-[340px] md:w-[340px] md:opacity-30" />
        <div className="relative max-w-2xl">
        <p className="eyebrow">Safran Aircraft Engines · Entretien</p>
        <h1 className="mt-3 text-[40px] font-medium leading-[44px] md:text-[56px] md:leading-[60px]">
          Intégration des transmissions mécaniques
        </h1>
        <p className="mt-4 max-w-xl text-[17px] leading-7 text-muted">
          {o.total} questions tirées de ton rapport, de tes slides et de ton questionnaire. Rien d&apos;inventé: ce qui reste à
          vérifier est signalé.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/session/?mode=adaptive">
            <Button>Lancer la révision du jour</Button>
          </Link>
          {o.toReview > 0 && (
            <Link href="/session/?mode=adaptive&review=1" className="text-[15px] underline underline-offset-4">
              Réviser mes {o.toReview} notions à revoir
            </Link>
          )}
        </div>
        </div>
        <dl className="mono relative mt-10 grid grid-cols-2 border border-ink/80 text-[11.5px] uppercase tracking-wider md:grid-cols-4">
          {[["Projet", "Prépa entretien"], ["Sujet", "MOA · transmissions"], ["Sources", "Rapport v3 · Slides v3 · Questionnaire"], ["Rév.", "06/10/2026"]].map(([k, v], i) => (
            <div key={k} className={"bg-surface px-3 py-2 " + (i % 2 === 0 ? "border-r border-ink/80 " : "") + (i < 2 ? "border-b border-ink/80 md:border-b-0 " : "") + (i < 3 ? "md:border-r md:border-ink/80" : "md:border-r-0")}>
              <dt className="text-muted">{k}</dt>
              <dd className="mt-0.5 normal-case tracking-normal text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-label="Statistiques" className="grid grid-cols-2 border-y border-ink/80 md:grid-cols-4">
        <Stat label="Maîtrisées" value={`${o.mastered}`} sub={`sur ${o.total}`} />
        <Stat label="Déjà vues" value={`${o.seen}`} sub={pct(o.seen / o.total)} />
        <Stat label="À revoir" value={`${o.due + o.toReview}`} sub="aujourd'hui" />
        <Stat label="Série" value={`${streak}`} sub={avg === null ? "jours · aucune session" : `jours · moyenne ${pct(avg)}`} />
      </section>

      <section id="modes" aria-label="Modes de révision" className="scroll-mt-4">
        <h2 className="text-[28px] leading-9"><span className="mono mr-3 text-sm text-brand">A.</span>Modes de révision</h2>
        <ol className="mt-5 border-t border-ink/80">
          {ORDER.map((m, i) => (
            <li key={m} className="border-b border-line">
              <Link href={`/session/?mode=${m}`} className="row group grid grid-cols-[2.75rem_1fr_auto] items-baseline gap-x-3 py-4 pl-3 hover:bg-surface">
                <span className="row-n mono text-sm text-muted transition-colors">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="serif block text-xl leading-7">{MODES[m].label}</span>
                  <span className="mt-0.5 block text-[15px] leading-6 text-muted">{MODES[m].desc}</span>
                </span>
                <span aria-hidden className="text-muted transition-transform duration-150 group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Sec>
          <h2 className="mb-4 text-2xl leading-8">Points faibles</h2>
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
        </Sec>
        <Sec>
          <h2 className="mb-4 text-2xl leading-8">Dernières sessions</h2>
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
                  <span className="tabnum font-medium">{h.score % 1 ? h.score.toFixed(1) : h.score}/{h.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Sec>
      </div>

      <Sec>
        <h2 className="mb-4 text-2xl leading-8">Avancement par chapitre</h2>
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.group} href={`/library/?group=${encodeURIComponent(g.group)}`} className="block hover:bg-ink/[0.03]">
              <div className="mb-1 flex justify-between text-sm">
                <span>{g.group}</span>
                <span className="text-muted">{g.mastered}/{g.total}</span>
              </div>
              <Progress value={(g.mastered / g.total) * 100} tone="green" />
            </Link>
          ))}
        </div>
      </Sec>

      <Sec>
        <h2 className="mb-4 text-2xl leading-8">Mes données</h2>
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
      </Sec>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-line px-0 py-5 odd:border-r odd:pr-4 even:pl-4 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0 [&:nth-child(-n+2)]:border-b md:[&:nth-child(-n+2)]:border-b-0">
      <p className="eyebrow">{label}</p>
      <p className="serif tabnum mt-2 text-[44px] leading-[48px]">{value}</p>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  );
}

function Sec({ children }: { children: React.ReactNode }) {
  return <section className="border-t border-ink/80 pt-5">{children}</section>;
}
