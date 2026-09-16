import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function ProductPageHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="label-eyebrow">{eyebrow}</p>
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
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="type-section-title text-foreground">{title}</h2>
          {description ? <p className="mt-1 type-meta text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function FoundationNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-3 type-meta text-muted-foreground">
      {children}
    </div>
  );
}

export function MetricPreview({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="metric-tile min-w-0 p-4">
      <p className="type-caption uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-2 type-metric text-foreground">{value}</p>
      <p className="mt-1 type-caption text-muted-foreground">{detail}</p>
    </div>
  );
}
