import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  description?: string;
  className?: string;
}

export default function SectionHeader({ title, action, onAction, description, className }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className ?? ""}`}>
      <div>
        <h2 className="font-display text-2xl text-[hsl(var(--golfer-deep))]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[hsl(var(--golfer-deep-soft))]/[0.76]">{description}</p>
        ) : null}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1 text-sm font-medium text-[hsl(var(--golfer-deep))] transition hover:text-primary"
        >
          {action} <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
