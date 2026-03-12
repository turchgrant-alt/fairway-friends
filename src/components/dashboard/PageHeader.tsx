import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 rounded-[32px] border border-[hsl(var(--golfer-line))] bg-white/80 p-6 shadow-[0_24px_70px_-48px_rgba(12,25,19,0.35)] backdrop-blur-sm sm:p-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[hsl(var(--golfer-deep-soft))]/[0.62]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl leading-tight text-[hsl(var(--golfer-deep))] sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.78] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
