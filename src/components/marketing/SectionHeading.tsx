import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  inverted?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.28em]",
          inverted ? "text-white/[0.65]" : "text-[hsl(var(--golfer-deep-soft))]/[0.70]",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-4 text-3xl leading-tight sm:text-4xl",
          inverted ? "text-white" : "text-[hsl(var(--golfer-deep))]",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-base leading-7 sm:text-lg",
          inverted ? "text-white/[0.72]" : "text-[hsl(var(--golfer-deep-soft))]/[0.78]",
        )}
      >
        {description}
      </p>
    </div>
  );
}
