import { cn } from "@/shared/utils";

const CATEGORY_OPTIONS = ["전체", "바다", "자연", "문화", "체험"] as const;

export type CollectionCategory = (typeof CATEGORY_OPTIONS)[number];

type CategoryTabsProps = {
  selected: CollectionCategory;
  onChange: (category: CollectionCategory) => void;
};

const CATEGORY_BUTTON_CLASS: Record<CollectionCategory, string> = {
  전체: "bg-collection-all",
  바다: "bg-collection-sea",
  자연: "bg-collection-nature",
  문화: "bg-collection-culture",
  체험: "bg-collection-experience",
};

export function CategoryTabs({ selected, onChange }: CategoryTabsProps) {
  return (
    <div className="flex w-full gap-3">
      {CATEGORY_OPTIONS.map((category) => {
        const isSelected = selected === category;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={cn(
              "flex-1 cursor-pointer rounded-2xl border border-collection-border py-1.5 font-ssurround text-sm text-text-heading transition-transform",
              "shadow-[2px_2px_0_var(--color-collection-shadow)] active:translate-x-[1px] active:translate-y-[1px]",
              isSelected ? CATEGORY_BUTTON_CLASS[category] : "bg-collection-bg",
              isSelected && "translate-x-[1px] translate-y-[1px] shadow-none",
            )}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
