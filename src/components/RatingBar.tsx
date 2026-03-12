interface RatingBarProps {
  label: string;
  value: number;
  max?: number;
}

export default function RatingBar({ label, value, max = 10 }: RatingBarProps) {
  const pct = (value / max) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-card-foreground">{value}</span>
    </div>
  );
}
