import type { AnalysisResult } from "@/lib/types";
import { CheckCircle, XCircle, AlertTriangle, ClipboardList } from "lucide-react";

interface SummaryCardsProps {
  results: AnalysisResult[];
}

export function SummaryCards({ results }: SummaryCardsProps) {
  const total = results.length;
  const met = results.filter((r) => r.status === "met").length;
  const partial = results.filter((r) => r.status === "partial").length;
  const notMet = results.filter((r) => r.status === "not_met").length;

  const cards = [
    {
      label: "Total",
      value: total,
      Icon: ClipboardList,
      color: "text-zinc-600",
      bg: "bg-zinc-50",
    },
    {
      label: "Met",
      value: met,
      Icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Partial",
      value: partial,
      Icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Not Met",
      value: notMet,
      Icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex items-center gap-4 rounded-xl ${card.bg} p-4`}
        >
          <card.Icon className={`h-8 w-8 ${card.color}`} />
          <div>
            <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
            <p className="text-sm text-zinc-500">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
