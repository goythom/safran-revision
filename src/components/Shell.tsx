"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { cx } from "./ui";
import { ModeIcon, Home, Library } from "./icons";
import { Layers, Target } from "lucide-react";
import type { Mode } from "@/lib/types";

const NAV: { href: string; label: string; mode?: Mode; icon?: "home" | "library" }[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/session/?mode=adaptive", label: "Révision du jour", mode: "adaptive" },
  { href: "/session/?mode=flashcards", label: "Flashcards", mode: "flashcards" },
  { href: "/session/?mode=qcm", label: "QCM", mode: "qcm" },
  { href: "/session/?mode=quiz", label: "Quiz chrono", mode: "quiz" },
  { href: "/session/?mode=exam", label: "Examen", mode: "exam" },
  { href: "/session/?mode=interview", label: "Entretien", mode: "interview" },
  { href: "/schemas/", label: "Schémas", icon: "library" },
  { href: "/library/", label: "Bibliothèque", icon: "library" },
];

function useVariant() {
  const sub = (cb: () => void) => {
    window.addEventListener("variant-change", cb);
    return () => window.removeEventListener("variant-change", cb);
  };
  const v = useSyncExternalStore(sub, () => document.documentElement.dataset.v ?? "a", () => "a");
  const toggle = () => {
    const next = v === "a" ? "b" : "a";
    document.documentElement.dataset.v = next;
    try { localStorage.setItem("safran-v", next); } catch {}
    window.dispatchEvent(new Event("variant-change"));
  };
  return { v, toggle };
}

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/session/?mode=adaptive", label: "Réviser", icon: Target },
  { href: "/#modes", label: "Modes", icon: Layers },
  { href: "/library/", label: "Notions", icon: Library },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { v, toggle } = useVariant();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.split(/[?#]/)[0].replace(/\/$/, "")));
  const swap = (
    <button onClick={toggle} className="rounded-full border border-current/30 px-3 py-1.5 text-sm font-semibold opacity-80 hover:opacity-100" aria-label="Changer de style">
      Style {v === "a" ? "A" : "B"}
    </button>
  );
  return (
    <div className="min-h-screen md:flex">
      <aside className="side hidden border-r-2 border-line md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0">
        <div className="px-5 py-6">
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand">Safran AE</p>
          <p className="logo text-2xl font-extrabold leading-8">Prépa entretien</p>
        </div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-3 pb-4">
          {NAV.map((n) => {
            const on = isActive(n.href) && !n.href.includes("?");
            return (
              <Link key={n.href} href={n.href} className={cx("nl flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition-colors duration-150", on ? "on bg-brand-soft text-brand" : "text-muted hover:bg-black/[0.04] hover:text-ink")}>
                {n.mode ? <ModeIcon mode={n.mode} className="h-5 w-5" /> : n.icon === "home" ? <Home className="h-5 w-5" aria-hidden /> : <Library className="h-5 w-5" aria-hidden />}
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5">{swap}</div>
      </aside>
      <header className="topbar flex items-center justify-between px-5 pb-3 pt-4 md:hidden">
        <p className="text-lg font-extrabold leading-6"><span style={{ color: "var(--neon, #0b5fff)" }}>Safran</span> prépa</p>
        {swap}
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-5 pb-32 md:px-10 md:py-10 md:pb-10">{children}</main>
      <nav aria-label="Navigation mobile" className="dock fixed inset-x-3 bottom-3 z-20 grid h-16 grid-cols-4 rounded-3xl border border-black/5 bg-white/85 shadow-[0_8px_30px_rgba(0,0,0,.14)] backdrop-blur-xl md:hidden">
        {TABS.map((t) => {
          const on = t.href.includes("#") ? false : isActive(t.href);
          return (
            <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined} className={cx("m-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-semibold transition-colors", on ? "on bg-brand-soft text-brand" : "text-muted")}>
              <t.icon className="h-5 w-5" aria-hidden />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
