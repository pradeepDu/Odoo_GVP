import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: "default" | "green" | "amber" | "red" | "blue";
  className?: string;
}

const accentClasses: Record<NonNullable<KPICardProps["accent"]>, string> = {
  default: "",
  green: "border-l-4 border-l-emerald-500",
  amber: "border-l-4 border-l-amber-500",
  red: "border-l-4 border-l-red-500",
  blue: "border-l-4 border-l-blue-500",
};

export function KPICard({ label, value, sub, icon: Icon, accent = "default", className }: KPICardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        accentClasses[accent],
        className
      )}
    >
      <div className="flex flex-row items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}
