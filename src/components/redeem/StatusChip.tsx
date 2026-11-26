import type { RedemptionStatus } from "@/lib/db/schema";
import { cn } from "@/lib/ui";

const MAP: Record<RedemptionStatus, [string, string]> = {
  awaiting_payment: ["Awaiting top-up", "bg-clay-mist text-clay-deep"],
  requested: ["Confirming with the venue", "bg-sand text-ink-soft"],
  confirmed: ["Confirmed", "bg-sage-mist text-moss"],
  declined: ["Dates unavailable", "bg-clay-mist text-clay-deep"],
  cancelled: ["Cancelled", "bg-sand text-muted"],
  completed: ["Enjoyed", "bg-sage-mist text-moss"],
};

export function StatusChip({ status, className }: { status: RedemptionStatus; className?: string }) {
  const [label, cls] = MAP[status];
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", cls, className)}>{label}</span>;
}
