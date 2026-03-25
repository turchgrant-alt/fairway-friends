import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[hsl(var(--golfer-line))] bg-white/80 p-4 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.62]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-xl leading-tight text-[hsl(var(--golfer-deep))]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[hsl(var(--golfer-deep-soft))]/[0.78]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
