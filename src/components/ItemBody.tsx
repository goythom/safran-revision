"use client";
import { Badge } from "./ui";
import { KIND_LABEL, LEVEL_LABEL } from "@/lib/content";
import type { Item } from "@/lib/types";

export function Meta({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="blue">{KIND_LABEL[item.kind]}</Badge>
      <Badge>{item.group}</Badge>
      <Badge>{LEVEL_LABEL[item.level]}</Badge>
      {item.unverified && <Badge tone="amber">À vérifier{item.reasons?.length ? " · " + item.reasons.join(", ") : ""}</Badge>}
    </div>
  );
}

export function Source({ item }: { item: Item }) {
  if (!item.source) return null;
  const url = item.source.match(/https?:\/\/\S+/)?.[0];
  return (
    <p className="mt-3 break-words text-xs text-muted">
      Source : {url ? (
        <>
          {item.source.replace(url, "").trim()}{" "}
          <a href={url} target="_blank" rel="noreferrer" className="underline">{url}</a>
        </>
      ) : item.source}
    </p>
  );
}

function Block({ title, text }: { title: string; text?: string }) {
  if (!text) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}

/** The answer side of any item, in a format that fits its kind. */
export function AnswerBody({ item }: { item: Item }) {
  if (item.kind === "qcm") {
    return (
      <div>
        <p className="font-semibold">Bonne réponse : {item.options?.[item.correct as number]}</p>
        <Block title="Explication" text={item.explanation} />
      </div>
    );
  }
  if (item.kind === "vf") {
    return (
      <div>
        <p className="font-semibold">{item.correct ? "Vrai" : "Faux"}</p>
        <Block title="Explication" text={item.explanation} />
      </div>
    );
  }
  if (item.kind === "calc") {
    return (
      <div>
        <Block title="Hypothèses" text={item.hypotheses} />
        <Block title="Formule" text={item.formula} />
        <Block title="Étapes" text={item.steps} />
        <Block title="Résultat" text={item.result} />
        <Block title="Interprétation" text={item.explanation} />
        <p className="mt-2 text-xs text-warn">Exemple pédagogique : valeurs d&apos;exercice, pas des données moteur.</p>
      </div>
    );
  }
  if (item.kind === "case") {
    return (
      <div>
        <Block title="Réponse modèle (30-60 s)" text={item.answer} />
        <Block title="Points clés" text={item.keyPoints} />
        <Block title="Pièges" text={item.pitfalls} />
        <Block title="Relances possibles" text={item.followUps} />
      </div>
    );
  }
  return (
    <div>
      <p className="whitespace-pre-line">{item.answer}</p>
      {item.en && <p className="mt-2 text-sm text-muted">EN : {item.en}</p>}
    </div>
  );
}

/** Schéma issu de la présentation v3, avec sa source. */
export function Figure({ item }: { item: Item }) {
  const im = item.image;
  if (!im) return null;
  return (
    <figure className="fig mt-3">
      <a href={im.src} target="_blank" rel="noreferrer" aria-label={`Agrandir : ${im.caption}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={im.src} alt={`${im.caption} (${im.source})`} loading="lazy" />
      </a>
      <figcaption>
        <span className="tag">{im.kind === "légende" ? "Schéma" : "Schéma lié"}</span> {im.caption} · {im.source}
        {im.kind !== "légende" && " · lien déduit du sujet de la question"}
      </figcaption>
    </figure>
  );
}
