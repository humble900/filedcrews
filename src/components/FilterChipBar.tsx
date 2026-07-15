import { X, Filter } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterChipProps {
  label: string;
  selectedValue: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  onClear: () => void;
}

export function FilterChip({
  label,
  selectedValue,
  options,
  onSelect,
  onClear,
}: FilterChipProps) {
  const isActive = selectedValue && selectedValue !== "ALL" && selectedValue !== "all";
  const activeLabel = options.find((o) => o.value === selectedValue)?.label || selectedValue;

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        className={`filter-chip ${isActive ? "active" : ""}`}
        value={selectedValue}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="ALL">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center justify-center text-primary/70 hover:text-primary"
          style={{ width: "16px", height: "16px" }}
          title={`Clear ${label} filter`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface FilterChipBarProps {
  children?: React.ReactNode;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

export default function FilterChipBar({
  children,
  onClearAll,
  hasActiveFilters = false,
}: FilterChipBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-1 border-b border-border/20">
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mr-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground/60" />
        <span>Filters:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {children}
        {hasActiveFilters && onClearAll && (
          <button
            onClick={onClearAll}
            className="text-xs font-bold text-destructive hover:underline ml-2"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}
