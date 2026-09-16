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
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-3 sm:flex-row sm:items-center sm:justify-between">
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
      onClick={onClick}
      disabled={disabled}
      className={`touch-target inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border px-3 type-meta font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        active
          ? "border-primary/35 bg-primary/12 text-primary"
          : "border-border/70 bg-background/25 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
      }`}
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
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-background/30 p-1" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`touch-target inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg px-3 type-meta font-medium transition-colors ${
              active ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
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
        className="min-h-11 w-full rounded-xl border border-input/80 bg-background/40 py-2 pl-9 pr-3 type-meta text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring"
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
  const toneClass = {
    neutral: "border-border/70 bg-secondary/35 text-muted-foreground",
    info: "border-primary/25 bg-primary/10 text-primary",
    live: "border-destructive/30 bg-destructive/10 text-destructive",
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/25 bg-warning/10 text-warning",
  }[tone];

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 type-caption font-medium ${toneClass}`}>
      {children}
    </span>
  );
}
