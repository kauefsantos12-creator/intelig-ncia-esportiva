import { Search } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

export function FilterBar({
  label,
  children,
  trailing,
}: {
  label: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="filter-bar flex min-w-0 flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="sr-only">{label}</p>
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-0.5" role="group" aria-label={label}>
          {children}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
  disabled = false,
}: {
  active: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-active={active ? "true" : "false"}
      onClick={onClick}
      disabled={disabled}
      className="filter-chip touch-target inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-3 type-meta font-medium disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented-control inline-flex max-w-full gap-1 overflow-x-auto rounded-xl p-1" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            data-active={active ? "true" : "false"}
            onClick={() => onChange(option.value)}
            className="segmented-option touch-target inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-3 type-meta font-medium text-muted-foreground transition-all hover:text-foreground"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({
  label,
  className = "",
  ...props
}: { label: string; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  return (
    <label className={`relative block min-w-0 ${className}`}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        {...props}
        aria-label={label}
        className="search-field min-h-11 w-full rounded-xl py-2 pl-9 pr-3 type-meta text-foreground outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "info" | "live" | "success" | "warning";
}) {
  return (
    <span data-tone={tone} className="status-badge inline-flex min-h-7 items-center rounded-full px-2.5 type-caption font-medium">
      {children}
    </span>
  );
}
