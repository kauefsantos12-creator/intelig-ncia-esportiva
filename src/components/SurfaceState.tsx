import { Inbox, LoaderCircle, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SurfaceStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: SurfaceStateProps) {
  return (
    <div className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-secondary/20 px-5 py-8 text-center ${className}`}>
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/45 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="mt-4 type-label text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md type-meta text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Não foi possível carregar",
  description,
  onRetry,
  retryLabel = "Tentar novamente",
  className = "",
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div role="alert" className={`flex min-h-48 flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-8 text-center ${className}`}>
      <div className="flex size-11 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" aria-hidden />
      </div>
      <h3 className="mt-4 type-label text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md type-meta text-muted-foreground">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="touch-target mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-secondary/45 px-4 type-label text-foreground transition-colors hover:bg-secondary"
        >
          <RefreshCw className="size-4" aria-hidden />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label = "Carregando dados esportivos",
  rows = 4,
  compact = false,
  className = "",
}: {
  label?: string;
  rows?: number;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label={label} className={`rounded-2xl border border-border/60 bg-secondary/15 ${compact ? "p-3" : "p-4 sm:p-5"} ${className}`}>
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-2 text-muted-foreground" aria-hidden>
        <LoaderCircle className="size-4 animate-spin" />
        <div className="h-3 w-28 animate-pulse rounded-full bg-muted/55" />
      </div>
      <div className={compact ? "mt-3 space-y-2" : "mt-4 space-y-3"} aria-hidden>
        {Array.from({ length: Math.max(1, rows) }, (_, index) => (
          <div key={index} className={`animate-pulse rounded-xl border border-border/45 bg-secondary/35 ${compact ? "h-10" : "h-14"}`} />
        ))}
      </div>
    </div>
  );
}

export function InlineState({
  icon: Icon,
  children,
  tone = "neutral",
}: {
  icon: LucideIcon;
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass = {
    neutral: "border-border/70 bg-secondary/25 text-muted-foreground",
    success: "border-success/20 bg-success/8 text-success",
    warning: "border-warning/25 bg-warning/8 text-warning",
  }[tone];

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 type-meta ${toneClass}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
