"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Variant = "primary" | "ghost" | "good" | "bad" | "warn";
const V: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:bg-brand",
  ghost: "border border-ink/30 bg-transparent hover:border-ink",
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
        "press inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-5 py-2.5 text-[15px] font-medium transition-colors duration-150 disabled:opacity-40",
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
    <div className={cx("plate border border-line p-5 md:p-6", className)}>
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
    gray: "border-line text-muted",
    blue: "border-brand/50 text-brand",
    green: "border-ok/50 text-ok",
    amber: "border-warn/60 bg-warn-soft text-warn",
    red: "border-bad/50 text-bad",
  }[tone];
  return (
    <span className={cx("mono inline-block rounded-[2px] border px-1.5 py-px text-[11px] font-medium uppercase tracking-wider", t)}>
      {children}
    </span>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "green" }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="dim" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx("transition-all duration-300", tone === "green" ? "bg-ink" : "bg-brand")} style={{ width: `${v}%` }} />
    </div>
  );
}

export const pct = (n: number) => `${Math.round(n * 100)} %`;
