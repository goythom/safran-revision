"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Variant = "primary" | "ghost" | "good" | "bad" | "warn";
const V: Record<Variant, string> = {
  primary: "bg-brand text-white hover:opacity-90 dark:text-[#0b1626]",
  ghost: "border border-line bg-surface hover:bg-black/5 dark:hover:bg-white/5",
  good: "bg-ok text-white hover:opacity-90 dark:text-[#0b1626]",
  bad: "bg-bad text-white hover:opacity-90 dark:text-[#0b1626]",
  warn: "bg-warn-soft text-warn border border-warn/40 hover:opacity-90",
};

export function Button({
  variant = "primary",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-base font-semibold transition-colors duration-150 disabled:opacity-40",
        V[variant],
        className,
      )}
    />
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
    <div className={cx("rounded-xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(17,24,39,.06)]", className)}>
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
    gray: "bg-slate-500/15 text-muted",
    blue: "bg-brand-soft text-brand",
    green: "bg-ok-soft text-ok",
    amber: "bg-warn-soft text-warn",
    red: "bg-bad-soft text-bad",
  }[tone];
  return (
    <span className={cx("inline-block rounded-full px-2.5 py-0.5 text-sm font-medium", t)}>
      {children}
    </span>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-slate-500/20"
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-all", tone === "green" ? "bg-ok" : "bg-brand")}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export const pct = (n: number) => `${Math.round(n * 100)} %`;
