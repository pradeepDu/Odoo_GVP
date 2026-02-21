import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  ON_TRIP: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  IN_SHOP: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  OUT_OF_SERVICE: "bg-red-500/20 text-red-600 dark:text-red-400",
  DRAFT: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  DISPATCHED: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  COMPLETED: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-600 dark:text-red-400",
  ON_DUTY: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  OFF_DUTY: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  SUSPENDED: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export function StatusPill({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const s = String(status).replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {s}
    </span>
  );
}
