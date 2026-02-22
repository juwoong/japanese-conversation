/**
 * variationEngine — manages variation scenarios where previously
 * encountered expressions appear in new situations.
 *
 * Key rule: expressions that were "wrong choices" in a base scenario
 * become the correct answers in variation scenarios.
 * No "wrong/incorrect" framing — variations are simply "new situations."
 *
 * TODO: 현재 MVP는 하드코딩된 메타데이터만 제공 (식당 3개 변주).
 *       Watch/Engage 단계는 base 대화를 그대로 사용하고,
 *       Catch/Review에서 "이 표현도 알아두세요" 수준의 태그만 표시.
 *       향후 DB에 variation별 situation + lines 레코드를 추가하면
 *       실제 변주 대사 재생 + SRS 추적이 가능해짐.
 */

export interface ReusedExpression {
  expression: string;
  roleInBase: "wrong_choice" | "correct";
  roleInVariation: "correct" | "wrong_choice";
}

export interface VariationLink {
  baseSituation: string;
  variationSlug: string;
  prerequisite: string;
  reusedExpressions: ReusedExpression[];
}

// MVP hardcoded restaurant variations
const VARIATION_LINKS: VariationLink[] = [
  {
    baseSituation: "restaurant",
    variationSlug: "restaurant_allergy",
    prerequisite: "restaurant",
    reusedExpressions: [
      {
        expression: "すみません",
        roleInBase: "correct",
        roleInVariation: "correct",
      },
      {
        expression: "アレルギーがあるんですが",
        roleInBase: "wrong_choice",
        roleInVariation: "correct",
      },
      {
        expression: "おねがいします",
        roleInBase: "correct",
        roleInVariation: "correct",
      },
    ],
  },
  {
    baseSituation: "restaurant",
    variationSlug: "restaurant_missing_menu",
    prerequisite: "restaurant",
    reusedExpressions: [
      {
        expression: "すみません",
        roleInBase: "correct",
        roleInVariation: "correct",
      },
      {
        expression: "売り切れですか",
        roleInBase: "wrong_choice",
        roleInVariation: "correct",
      },
      {
        expression: "じゃあ、これにします",
        roleInBase: "wrong_choice",
        roleInVariation: "correct",
      },
    ],
  },
  {
    baseSituation: "restaurant",
    variationSlug: "restaurant_friend_order",
    prerequisite: "restaurant",
    reusedExpressions: [
      {
        expression: "すみません",
        roleInBase: "correct",
        roleInVariation: "correct",
      },
      {
        expression: "友達の分もおねがいします",
        roleInBase: "wrong_choice",
        roleInVariation: "correct",
      },
      {
        expression: "別々でおねがいします",
        roleInBase: "wrong_choice",
        roleInVariation: "correct",
      },
    ],
  },
];

/**
 * Get available variations for a set of completed situations.
 * A variation is available when its prerequisite situation is completed.
 */
export function getAvailableVariations(
  completedSituations: string[]
): VariationLink[] {
  const completed = new Set(completedSituations);
  return VARIATION_LINKS.filter((link) => completed.has(link.prerequisite));
}

/**
 * Check if a specific variation is unlocked.
 */
export function isVariationUnlocked(
  variationSlug: string,
  completedSituations: string[]
): boolean {
  const completed = new Set(completedSituations);
  const link = VARIATION_LINKS.find((l) => l.variationSlug === variationSlug);
  if (!link) return false;
  return completed.has(link.prerequisite);
}

/**
 * Get variation data for building a session.
 * Returns the base situation, new expressions (promoted from wrong_choice),
 * and expressions reused from the base.
 */
export function getVariationData(
  variationSlug: string
): {
  baseSituation: string;
  newExpressions: string[];
  reusedFromBase: string[];
} | null {
  const link = VARIATION_LINKS.find((l) => l.variationSlug === variationSlug);
  if (!link) return null;

  const newExpressions = link.reusedExpressions
    .filter((e) => e.roleInBase === "wrong_choice" && e.roleInVariation === "correct")
    .map((e) => e.expression);

  const reusedFromBase = link.reusedExpressions
    .filter((e) => e.roleInBase === "correct" && e.roleInVariation === "correct")
    .map((e) => e.expression);

  return {
    baseSituation: link.baseSituation,
    newExpressions,
    reusedFromBase,
  };
}

/**
 * Count available variations for a given base situation slug.
 */
export function countVariationsForSituation(
  situationSlug: string,
  completedSituations: string[]
): number {
  const completed = new Set(completedSituations);
  return VARIATION_LINKS.filter(
    (link) =>
      link.baseSituation === situationSlug && completed.has(link.prerequisite)
  ).length;
}

/**
 * Get all variation slugs for a base situation.
 */
export function getVariationSlugsForSituation(
  situationSlug: string
): string[] {
  return VARIATION_LINKS.filter((link) => link.baseSituation === situationSlug).map(
    (link) => link.variationSlug
  );
}

/** MVP 변주 라벨 (UI 표시용) */
export const VARIATION_LABELS: Record<string, string> = {
  restaurant_allergy: "알레르기 상황",
  restaurant_missing_menu: "품절 상황",
  restaurant_friend_order: "친구와 함께",
};

/** 변주 접근에 필요한 최소 방문 횟수 */
export const VARIATION_MIN_VISITS = 2;
