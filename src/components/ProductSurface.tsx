import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function ProductPageHeader({
  eyebrow,
  title,
  description,
  aside,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-eyebrow">{eyebrow}</p>
          {meta}
        </div>
        <h1 className="mt-2 type-page-title text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl type-body text-muted-foreground">{description}</p>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

export function SurfaceCard({
  icon: Icon,
  title,
  description,
  children,
  actions,
  className = "",
  density = "default",
  tone = "default",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  density?: "compact" | "default";
  tone?: "default" | "subtle";
}) {
  const titleId = useId();
  const padding = density === "compact" ? "p-4" : "p-5 sm:p-6";
  const toneClass = tone === "subtle" ? "bg-surface/65 shadow-none" : "";

  return (
    <section aria-labelledby={titleId} className={`panel ${padding} ${toneClass} ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="type-section-title text-foreground">{title}</h2>
          {description ? <p className="mt-1 type-meta text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children ? <div className={density === "compact" ? "mt-4" : "mt-5"}>{children}</div> : null}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="label-eyebrow">{eyebrow}</p> : null}
        <h2 className={`${eyebrow ? "mt-1.5" : ""} type-section-title text-foreground`}>{title}</h2>
        {description ? <p className="mt-1 type-meta text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function FoundationNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 type-meta text-muted-foreground">
      {children}
    </div>
  );
}

export function MetricPreview({
  label,
  value,
  detail,
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  trend?: ReactNode;
}) {
  return (
    <div className="metric-tile min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="type-caption uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        {trend ? <div className="shrink-0">{trend}</div> : null}
      </div>
      <p className="mt-2 type-metric text-foreground">{value}</p>
      <p className="mt-1 type-caption text-muted-foreground">{detail}</p>
    </div>
  );
}
