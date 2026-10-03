import type { Category } from "@/components/ui/CategoryChip";

export function getBookmarkCategory(value?: string, name?: string): Category | undefined {
  if (!value && !name) return undefined;
  if (name?.includes("해수욕장") || name?.includes("해변")) return "sea";
  if (!value) return undefined;
  if (value.includes("자연")) return "nature";
  if (value.includes("문화") || value.includes("역사")) return "culture";
  if (value.includes("체험") || value.includes("놀이")) return "experience";
  if (value.includes("바다") || value.includes("해수욕")) return "sea";
  return undefined;
}
