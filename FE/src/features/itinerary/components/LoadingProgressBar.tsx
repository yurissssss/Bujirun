interface LoadingProgressBarProps {
  progress: number;
  durationMs?: number;
  className?: string;
}

export function LoadingProgressBar({
  progress,
  durationMs = 3000,
  className = "w-[248px]",
}: LoadingProgressBarProps) {
  return (
    <div className={`${className} h-[8px] overflow-hidden rounded-lg bg-system-scroll`}>
      <div
        className="h-full rounded-lg bg-sub-deepblue transition-all ease-in-out"
        style={{ width: `${progress}%`, transitionDuration: `${durationMs}ms` }}
      />
    </div>
  );
}
