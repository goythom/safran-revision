"use client";
import { useState } from "react";
import slides from "@/data/slides.json";

const THEMES: [string, number[]][] = [
  ["Vol et propulsion", [4,5,6,7,8,9,10]],
  ["Coupes moteur : CFM56, LEAP, M88", [11,12,13,14,15,17,18,19]],
  ["AGB et chaîne d'accessoires", [21,22,23,24,25,26]],
  ["Réducteurs : PW1000G, TP400, épicycloïdal", [28,29,30,31,36,37,38]],
  ["Engrenages et roulements", [33,34,35]],
  ["Pré-dimensionnement et intégration", [39,40,42]],
];

export default function Page() {
  const [sel, setSel] = useState<number | null>(null);
  const by = Object.fromEntries(slides.map((s) => [s.page, s]));
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pb-32 pt-6">
        <p className="tag">Schémas et images</p>
        <h1 className="mt-2 text-3xl">Les schémas de la présentation</h1>
        <p className="mt-2 text-sm text-muted">{slides.length} schémas avec schéma, issues de la présentation v3 (57 p.). Touche une vignette pour l&apos;agrandir. Schémas recadrés (sans les encadrés de réponse). Dans les cartes, le schéma n'apparaît qu'après la réponse.</p>
        {THEMES.map(([t, ps]) => (
          <section key={t} className="mt-8">
            <h2 className="mb-3 text-lg">{t}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ps.map((p) => (
                <button key={p} onClick={() => setSel(p)} className="fig text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={by[p].file} alt={`${by[p].title}, diapo ${p}`} loading="lazy" />
                  <figcaption><span className="tag">{p}</span> {by[p].title.charAt(0) + by[p].title.slice(1).toLowerCase()} · Présentation v3, diapo {p}</figcaption>
                </button>
              ))}
            </div>
          </section>
        ))}
        {sel && (
          <div role="dialog" aria-modal="true" onClick={() => setSel(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b1a]/85 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={by[sel].file} alt={by[sel].title} className="max-h-full max-w-full rounded-2xl bg-white" />
          </div>
        )}
      </div>
    </>
  );
}
