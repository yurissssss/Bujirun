interface SwitchButtonProps {
  isPublic: boolean;
  onClick?: () => void;
}

export function SwitchButton({ isPublic, onClick }: SwitchButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-16 shrink-0 items-center justify-center rounded-lg ${
        isPublic ? "bg-main-blue" : "bg-sub-gray"
      }`}
    >
      <span className="translate-y-[1px] font-ssurround text-md font-bold leading-none tracking-[0.5px] text-main-white">
        {isPublic ? "공개" : "비공개"}
      </span>
    </button>
  );
}
