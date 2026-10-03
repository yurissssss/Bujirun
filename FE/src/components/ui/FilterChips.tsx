import { cn } from "@/shared/utils";

interface FilterChipsProps<T extends string> {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterChips<T extends string>({
  options,
  selected,
  onChange,
  className,
}: FilterChipsProps<T>) {
  return (
    <div className={cn("flex gap-2.5 overflow-x-auto", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "shrink-0 h-[25px] rounded-lg px-3.5 py-1 flex items-center justify-center text-md font-medium transition-colors",
            selected === option
              ? "bg-main-blue text-white"
              : "bg-system-searchbg border-[0.3px] border-main-blue text-sub-deepblue",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
