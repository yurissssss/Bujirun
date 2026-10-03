import { cn } from "@/shared/utils";

export type Category = "sea" | "nature" | "culture" | "experience";

interface CategoryChipProps {
  category: Category;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "strong";
  className?: string;
}

const CATEGORY_CONFIG: Record<Category, { label: string; defaultBg: string; strongBg: string }> = {
  sea: {
    label: "#바다",
    defaultBg: "bg-category-sea",
    strongBg: "bg-main-blue",
  },
  nature: {
    label: "#자연",
    defaultBg: "bg-category-nature",
    strongBg: "bg-sub-green",
  },
  culture: {
    label: "#문화",
    defaultBg: "bg-category-culture",
    strongBg: "bg-sub-pink",
  },
  experience: {
    label: "#체험",
    defaultBg: "bg-category-experience",
    strongBg: "bg-sub-violet",
  },
};

const SIZE_CLASS = {
  sm: "py-[3px] px-[5px] text-3xs",
  md: "py-[4px] px-[6px] text-xs",
  lg: "py-[6px] px-[10px] text-md",
};

export function CategoryChip({
  category,
  size = "md",
  variant = "default",
  className,
}: CategoryChipProps) {
  const { label, defaultBg, strongBg } = CATEGORY_CONFIG[category];
  const bg = variant === "strong" ? strongBg : defaultBg;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg",
        SIZE_CLASS[size],
        bg,
        className,
      )}
    >
      <span className="text-text-primary tracking-[0.16px]">{label}</span>
    </div>
  );
}
