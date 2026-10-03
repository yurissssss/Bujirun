import { cn } from "@/shared/utils";

const CONSONANTS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

interface ConsonantIndexBarProps {
  activeConsonants: string[];
  activeSection: string | null;
  onSelect: (consonant: string) => void;
}

export function ConsonantIndexBar({
  activeConsonants,
  activeSection,
  onSelect,
}: ConsonantIndexBarProps) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center gap-1 self-start rounded-md bg-system-navbg px-1 py-1">
      <span className="text-xs font-medium leading-none text-sub-deepblue">#</span>
      {CONSONANTS.map((c) => (
        <button
          key={c}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(c);
          }}
          className={cn(
            "flex w-[14px] items-center justify-center rounded-md py-px text-xs font-medium leading-none transition-colors",
            activeSection === c
              ? "bg-main-blue text-main-white"
              : activeConsonants.includes(c)
                ? "text-sub-deepblue"
                : "text-sub-lightgray",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
