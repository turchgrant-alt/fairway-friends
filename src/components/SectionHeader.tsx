import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4">
      <h2 className="font-display text-lg text-foreground">{title}</h2>
      {action && (
        <button onClick={onAction} className="flex items-center gap-0.5 text-xs font-medium text-primary">
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
