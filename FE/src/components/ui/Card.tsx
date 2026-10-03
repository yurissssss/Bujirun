import { cn } from "@/shared/utils";

type CardVariant = "glass-lg" | "glass-sm" | "white";

interface CardProps {
  variant?: CardVariant;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ variant = "glass-lg", className, children }: CardProps) {
  return <div className={cn(cardVariants[variant], className)}>{children}</div>;
}

const cardVariants: Record<CardVariant, string> = {
  "glass-lg": [
    "backdrop-blur-[15px]",
    "bg-gradient-to-b from-system-glassfrom to-system-glassto",
    "border border-system-whitebg",
    "rounded-3xl",
    "opacity-[0.97]",
    "p-[20px]",
  ].join(" "),

  "glass-sm": [
    "backdrop-blur-[15px]",
    "bg-gradient-to-b from-system-glassfrom to-system-glassto",
    "border border-system-glassborder",
    "rounded-2xl",
    "opacity-[0.97]",
    "p-[16px]",
  ].join(" "),

  white: ["bg-white", "rounded-2xl", "shadow-sm", "p-[16px]"].join(" "),
};
