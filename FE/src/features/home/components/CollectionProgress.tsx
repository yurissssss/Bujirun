import Image from "next/image";
import turtleIcon from "@/assets/icons/home/turtle.png";

interface CollectionProgressProps {
  count: number;
  total: number;
}

const VIEW_SIZE = 112;
const CENTER = VIEW_SIZE / 2;
const RADIUS = 38;
const STROKE_WIDTH = 35;

function pointOnCircle(progress: number) {
  const angle = progress * 2 * Math.PI - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

function describeArc(progress: number) {
  if (progress <= 0) return "";
  const start = pointOnCircle(0);
  const clamped = Math.min(progress, 0.9999);
  const end = pointOnCircle(clamped);
  const largeArcFlag = clamped > 0.5 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function CollectionProgress({ count, total }: CollectionProgressProps) {
  const progress = total > 0 ? count / total : 0;
  const { x, y } = pointOnCircle(progress);
  const xPercent = (x / VIEW_SIZE) * 100;
  const yPercent = (y / VIEW_SIZE) * 100;

  return (
    <div className="relative aspect-square w-40">
      <svg
        viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          className="stroke-system-whitebg"
          strokeWidth={STROKE_WIDTH}
        />

        {progress > 0 && (
          <path
            d={describeArc(progress)}
            fill="none"
            className="stroke-main-blue"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        )}
      </svg>

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
      >
        <Image src={turtleIcon} alt="거북이 아이콘" className="size-10 object-contain" />
      </div>
    </div>
  );
}
