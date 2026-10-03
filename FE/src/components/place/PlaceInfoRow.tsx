import { cn } from "@/shared/utils";
import { Card } from "@/components";

interface PlaceInfoItem {
  icon: string;
  label: string;
  value: string;
}

interface PlaceInfoRowProps {
  items: PlaceInfoItem[];
  className?: string;
}

export function PlaceInfoRow({ items, className }: PlaceInfoRowProps) {
  return (
    <Card variant="glass-sm" className={cn("w-[244px] flex flex-col gap-1 p-3", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[36px] h-[36px] rounded bg-system-navbg flex items-center justify-center">
              <span className="text-sm">{item.icon}</span>
            </div>
            <span className="font-medium text-xs text-text-primary">{item.label}</span>
          </div>
          <span className="font-medium text-xs text-text-primary">{item.value}</span>
        </div>
      ))}
    </Card>
  );
}
