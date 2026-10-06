"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Variant = "primary" | "ghost" | "good" | "bad" | "warn" | "light";
const V: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  good: "btn-good",
  bad: "btn-bad",
  warn: "btn-warn",
  light: "btn-light",
};

export function Button({
  variant = "primary",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button {...p} className={cx("btn", V[variant], className)}>
      {p.children}
      {(variant === "primary" || variant === "light") && <span className="btn-arrow" aria-hidden><ChevronRight className="h-4 w-4" /></span>}
    </button>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("card p-5 md:p-6", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "blue" | "green" | "amber" | "red";
}) {
  const t = {
    gray: "bg-black/[0.06] text-muted",
    blue: "bg-brand-soft text-brand",
    green: "bg-ok-soft text-ok",
    amber: "bg-warn-soft text-warn",
    red: "bg-bad-soft text-bad",
  }[tone];
  return (
    <span className={cx("chip-b", t)}>
      {children}
    </span>
  );
}

export function Progress({ value, onHero }: { value: number; tone?: "brand" | "green"; onHero?: boolean }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("bar", onHero && "on-hero")} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{ width: `${Math.max(v, v > 0 ? 3 : 0)}%` }} />
    </div>
  );
}

export const pct = (n: number) => `${Math.round(n * 100)} %`;
