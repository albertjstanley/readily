import type { ComplianceStatus } from "@/lib/types";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const config: Record<
  ComplianceStatus,
  { label: string; className: string; Icon: typeof CheckCircle }
> = {
  met: {
    label: "Met",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Icon: CheckCircle,
  },
  partial: {
    label: "Partial",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
    Icon: AlertTriangle,
  },
  not_met: {
    label: "Not Met",
    className: "bg-red-50 text-red-700 ring-red-200",
    Icon: XCircle,
  },
};

export function StatusBadge({ status }: { status: ComplianceStatus }) {
  const { label, className, Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
