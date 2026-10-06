"use client";
import Link from "next/link";
import { useRef } from "react";
import { Button, Card, Progress, pct } from "@/components/ui";
import { ModeIcon } from "@/components/icons";
import { CheckCircle2, Eye, Flame } from "lucide-react";
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

  const todo = o.due + o.toReview;
  return (
    <div className="space-y-10">
      <header className="rise">
        <p className="tag">Entretien Safran Aircraft Engines</p>
        <h1 className="mt-2 text-[38px] leading-[42px] md:text-[56px] md:leading-[58px]">Prépare ton entretien <span className="gt">sans rien oublier</span></h1>
      </header>

      <section className="hero rise p-6 md:p-8" style={{ animationDelay: "60ms" }} aria-label="Révision du jour">
        <p className="tag">Révision du jour</p>
        <p className="mt-2 text-[28px] font-extrabold leading-9 md:text-4xl md:leading-[44px]">
          {o.seen === 0 ? "Lance ta première session" : todo > 0 ? `${todo} notions à revoir` : "Tu es à jour"}
        </p>
        <p className="mt-1 max-w-md text-[15px] text-white/85">
          {o.total} questions tirées de ton rapport, de tes slides et de ton questionnaire. 10 minutes suffisent.
        </p>
        <div className="mt-5 max-w-md">
          <Progress value={(o.mastered / o.total) * 100} onHero />
          <p className="mt-2 text-sm font-semibold text-white/85">{o.mastered} maîtrisées sur {o.total}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="pill">{o.total} questions</span>
          <span className="pill">Rapport v3 · Slides v3</span>
          <span className="pill">Progression sur cet appareil</span>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link href="/session/?mode=adaptive"><Button variant="light">Commencer</Button></Link>
          {o.toReview > 0 && (
            <Link href="/session/?mode=adaptive&review=1" className="text-[15px] font-bold underline underline-offset-4">
              Seulement mes {o.toReview} à revoir
            </Link>
          )}
        </div>
      </section>

      <section aria-label="Statistiques" className="grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="h-6 w-6 text-[#ff9600]" />} value={`${streak}`} label={streak > 1 ? "jours d'affilée" : "jour d'affilée"} />
        <Stat icon={<CheckCircle2 className="h-6 w-6 text-ok" />} value={`${o.mastered}`} label="maîtrisées" />
        <Stat icon={<Eye className="h-6 w-6 text-brand" />} value={`${o.seen}`} label="déjà vues" />
      </section>

      <section id="modes" aria-label="Modes de révision" className="scroll-mt-6">
        <p className="tag mb-2">Modes</p>
        <h2 className="mb-5 text-[30px] leading-9">Choisis comment réviser</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {ORDER.map((m, i) => (
            <Link key={m} href={`/session/?mode=${m}`} className="tile rise" style={{ ["--tca" as string]: COLORS[m], animationDelay: `${120 + i * 40}ms` }}>
              <span className="tile-i"><ModeIcon mode={m} className="h-6 w-6" /></span>
              <span className="mt-3 block text-[17px] font-extrabold leading-6">{MODES[m].label}</span>
              <span className="mt-0.5 hidden text-sm leading-5 text-muted md:block">{MODES[m].desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-1">
          <h2 className="mb-4 text-xl">Points faibles</h2>
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
        <Card className="space-y-1">
          <h2 className="mb-4 text-xl">Dernières sessions</h2>
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
        </Card>
      </div>

      <Card className="space-y-1">
        <h2 className="mb-4 text-xl">Avancement par chapitre</h2>
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
      </Card>

      <Card className="space-y-1">
        <h2 className="mb-4 text-xl">Mes données</h2>
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

const COLORS: Record<Mode, string> = {
  adaptive: "#1a6fd1", flashcards: "#8549ba", qcm: "#3d9a00", vf: "#ff9600", open: "#00a8a0",
  cases: "#e5484d", quiz: "#d6409f", exam: "#4a4fe0", interview: "#0b2a4a",
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card rise flex flex-col items-center px-2 py-4 text-center">
      {icon}
      <p className="tabnum mt-1 text-[28px] font-extrabold leading-8">{value}</p>
      <p className="text-[13px] font-semibold text-muted">{label}</p>
    </div>
  );
}
