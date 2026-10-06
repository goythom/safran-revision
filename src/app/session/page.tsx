"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Session from "@/features/session/Session";
import type { Mode } from "@/lib/types";
import { MODES } from "@/lib/content";

function Inner() {
  const p = useSearchParams();
  const m = p.get("mode") as Mode | null;
  const mode: Mode = m && m in MODES ? m : "adaptive";
  const ids = p.get("ids")?.split(",").filter(Boolean);
  return (
    <Session
      key={`${mode}-${p.get("ids") ?? ""}-${p.get("review") ?? ""}-${p.get("n") ?? ""}`}
      mode={mode}
      presetIds={ids}
      reviewOnly={p.get("review") === "1"}
    />
  );
}
export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
