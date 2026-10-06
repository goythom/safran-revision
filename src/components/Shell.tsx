"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { cx } from "./ui";
import { ModeIcon, Home, Library, Moon, Sun } from "./icons";
import { Layers, Target } from "lucide-react";
import type { Mode } from "@/lib/types";

const NAV: { href: string; label: string; mode?: Mode; icon?: "home" | "library" }[] = [
  { href: "/", label: "Tableau de bord", icon: "home" },
  { href: "/session/?mode=adaptive", label: "Révision adaptative", mode: "adaptive" },
  { href: "/session/?mode=flashcards", label: "Flashcards", mode: "flashcards" },
  { href: "/session/?mode=qcm", label: "QCM", mode: "qcm" },
  { href: "/session/?mode=quiz", label: "Quiz chrono", mode: "quiz" },
  { href: "/session/?mode=exam", label: "Examen", mode: "exam" },
  { href: "/session/?mode=interview", label: "Entretien", mode: "interview" },
  { href: "/library/", label: "Bibliothèque", icon: "library" },
];

function useTheme() {
  const sub = (cb: () => void) => {
    window.addEventListener("theme-change", cb);
    return () => window.removeEventListener("theme-change", cb);
  };
  const dark = useSyncExternalStore(
    sub,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("safran-theme", next ? "dark" : "light"); } catch {}
    window.dispatchEvent(new Event("theme-change"));
  };
  return { dark, toggle };
}

const TABS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/session/?mode=adaptive", label: "Réviser", icon: Target },
  { href: "/#modes", label: "Modes", icon: Layers },
  { href: "/library/", label: "Bibliothèque", icon: Library },
];

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { dark, toggle } = useTheme();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.split(/[?#]/)[0].replace(/\/$/, "")));
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-line md:sticky md:top-0 md:block md:h-screen md:w-60 md:shrink-0">
        <div className="px-4 py-5">
          <p className="eyebrow text-brand">Safran AE</p>
          <p className="serif text-2xl leading-8">Prépa entretien</p>
        </div>
        <nav aria-label="Navigation principale" className="flex flex-col gap-1 px-2 pb-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cx(
                "flex min-h-11 items-center border-l-2 border-transparent px-3 py-2 text-[15px] transition-colors duration-150 hover:bg-ink/[0.04]",
                isActive(n.href) && !n.href.includes("?") && "border-brand font-semibold text-brand",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3">
          <button onClick={toggle} aria-label="Changer de thème" className="flex min-h-11 w-full items-center gap-2 rounded-[3px] border border-line px-3 text-base">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            {dark ? "Thème clair" : "Thème sombre"}
          </button>
        </div>
      </aside>
      <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <div>
          <p className="eyebrow text-brand">Safran AE</p>
          <p className="serif text-xl leading-6">Prépa entretien</p>
        </div>
        <button onClick={toggle} aria-label="Changer de thème" className="flex h-11 w-11 items-center justify-center rounded-[3px] border border-line">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-8">{children}</main>
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-4 border-t border-ink/80 bg-bg md:hidden">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={cx("flex flex-col items-center justify-center gap-0.5 text-sm font-medium", isActive(t.href) ? "font-semibold text-ink" : "text-muted")} aria-current={isActive(t.href) ? "page" : undefined}>
            <t.icon className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
