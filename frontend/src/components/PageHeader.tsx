import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  /** Optional: show filter/sort/search bar row */
  showFilters?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  groupByOptions?: { value: string; label: string }[];
  filterOptions?: { value: string; label: string }[];
  sortOptions?: { value: string; label: string }[];
  onGroupByChange?: (value: string) => void;
  onFilterChange?: (value: string) => void;
  onSortChange?: (value: string) => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions = [],
  showFilters = false,
  searchPlaceholder = "Search…",
  searchValue = "",
  onSearchChange,
  groupByOptions,
  filterOptions,
  sortOptions,
  onGroupByChange,
  onFilterChange,
  onSortChange,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(({ label, onClick, primary }) => (
            <Button
              key={label}
              type="button"
              onClick={onClick}
              variant={primary ? "default" : "outline"}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {groupByOptions && onGroupByChange && (
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              onChange={(e) => onGroupByChange(e.target.value)}
            >
              <option value="">Group by</option>
              {groupByOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {filterOptions && onFilterChange && (
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="">Filter</option>
              {filterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {sortOptions && onSortChange && (
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="">Sort by</option>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          {onSearchChange && (
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-45 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
      )}
    </div>
  );
}
