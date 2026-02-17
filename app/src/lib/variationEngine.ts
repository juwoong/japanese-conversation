/**
 * variationEngine — manages variation scenarios where previously
 * encountered expressions appear in new situations.
 *
 * Key rule: expressions that were "wrong choices" in a base scenario
 * become the correct answers in variation scenarios.
 * No "wrong/incorrect" framing — variations are simply "new situations."
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
