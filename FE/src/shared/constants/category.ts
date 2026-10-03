import type { Category } from "@/components";

export const CATEGORY_LABEL: Record<Category, string> = {
  sea: "#바다",
  nature: "#자연",
  culture: "#문화",
  experience: "#체험",
};

export const CATEGORY_LABEL_KO: Record<string, Category> = {
  바다: "sea",
  자연: "nature",
  문화: "culture",
  체험: "experience",
};

export function getCategoryLabel(category: Category): string {
  return CATEGORY_LABEL[category];
}

// 원본 category 문자열(예: "자연·공원")에는 "바다"가 별도 값으로 없어서, 해변/해수욕장
// 이름부터 먼저 확인한다 — 안 그러면 바다 스팟이 전부 "자연"으로만 분류돼서 바다
// 필터에 아무것도 안 걸린다 (home/recommend 등 다른 화면의 toCategory와 동일한 규칙).
export function getCategoryFromKo(ko?: string, name?: string): Category {
  if (name?.includes("해수욕장") || name?.includes("해변")) return "sea";

  if (!ko) return "nature";

  if (ko.includes("바다")) return "sea";
  if (ko.includes("자연")) return "nature";
  if (ko.includes("문화")) return "culture";
  if (ko.includes("체험")) return "experience";

  return CATEGORY_LABEL_KO[ko] ?? "nature";
}

export function getCategoryFromEN(en: string): Category {
  if (en.includes("sea")) return "sea";
  if (en.includes("nature")) return "nature";
  if (en.includes("culture")) return "culture";
  if (en.includes("experience")) return "experience";

  return CATEGORY_LABEL_KO[en] ?? "nature";
}

/**
 * 태그 문자열이 4개 카테고리(바다/자연/문화/체험) 중 하나와 정확히 일치하는지 확인.
 * 일치하지 않으면 undefined — 일반 태그는 카테고리로 간주하지 않는다.
 */
export function matchCategoryTag(tag: string): Category | undefined {
  return CATEGORY_LABEL_KO[tag.replace(/^#/, "")];
}

// GET /api/spots/search의 category 파라미터 — 도감(4개 카테고리)과 동일한 값(바다/자연/문화/체험)을 그대로 쓴다.
export const SPOT_SEARCH_CATEGORIES = ["바다", "자연", "문화", "체험"] as const;

export type SpotSearchCategory = (typeof SPOT_SEARCH_CATEGORIES)[number];

export const SPOT_SEARCH_CATEGORY_EMOJI: Record<SpotSearchCategory, string> = {
  바다: "🌊",
  자연: "🌿",
  문화: "🏛",
  체험: "🎡",
};
