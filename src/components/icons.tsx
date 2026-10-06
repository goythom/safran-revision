import { BookOpen, CheckCircle2, Clock, FileText, Home, Layers, Library, MessageSquare, Mic, Moon, Sun, Target, Calculator, Scale, type LucideIcon } from "lucide-react";
import type { Mode } from "@/lib/types";

const MAP: Record<Mode, LucideIcon> = {
  flashcards: Layers,
  qcm: CheckCircle2,
  vf: Scale,
  open: MessageSquare,
  cases: Calculator,
  adaptive: Target,
  quiz: Clock,
  exam: FileText,
  interview: Mic,
};

export function ModeIcon({ mode, className = "h-4 w-4" }: { mode: Mode; className?: string }) {
  const I = MAP[mode];
  return <I className={className} aria-hidden />;
}
export { Home, Library, BookOpen, Moon, Sun };
