import { APP_CONFIG } from "@/config";
import type { ScoredItem, OutfitCombination } from "@/types";
import {
  daysBetween,
  normalize,
  calculateCombinationColorHarmony,
} from "@/utils";
import type { WardrobeItem } from "@prisma/client";

/**
 * Deterministic outfit scoring engine.
 *
 * STEP 1: Filter eligible items
 * STEP 2: Score each item
 * STEP 3: Build valid combinations
 * STEP 4: Rank top N combinations
 */

const { scoring, outfit } = APP_CONFIG;

// ─── STEP 1: Filter eligible items ────────────────────────────────────

export function filterEligibleItems(
  items: WardrobeItem[],
  locationTag: string,
  currentSeason?: string,
  now: Date = new Date()
): WardrobeItem[] {
  return items.filter((item) => {
    if (!item.isActive) return false;
    if (item.locationTag !== locationTag) return false;

    // Season check
    if (
      currentSeason &&
      item.season !== "all" &&
      item.season !== currentSeason
    ) {
      return false;
    }

    // Exclude items worn too recently
    if (item.lastWornAt) {
      const daysSince = daysBetween(item.lastWornAt, now);
      if (daysSince < outfit.recentWornThresholdDays) return false;
    }

    return true;
  });
}

// ─── STEP 2: Score each item ───────────────────────────────────────────

export function scoreItem(
  item: WardrobeItem,
  targetFormality: number,
  avgConfidence: number,
  now: Date = new Date()
): ScoredItem {
  // Recency score: higher for items not worn recently
  const daysSinceWorn = item.lastWornAt
    ? daysBetween(item.lastWornAt, now)
    : 30; // Never worn → treat as 30 days
  const recencyScore = normalize(
    daysSinceWorn,
    0,
    outfit.reuseWindowDays * 2
  );

  // Underuse boost: items worn less get a boost
  const underuseScore =
    item.timesWorn < outfit.minReuseCount
      ? 1.0
      : normalize(
          outfit.maxReuseCount - item.timesWorn,
          0,
          outfit.maxReuseCount
        );

  // Overuse penalty
  const overusePenalty =
    item.timesWorn > outfit.maxReuseCount
      ? normalize(
          outfit.maxReuseCount * 2 - item.timesWorn,
          0,
          outfit.maxReuseCount
        )
      : 1.0;

  // Formality match
  const formalityDiff = Math.abs(item.formalityScore - targetFormality);
  const formalityScore = normalize(10 - formalityDiff, 0, 10);

  // Confidence weight (from historical ratings)
  const confidenceScore = normalize(avgConfidence, 0, 5);

  // Weighted total
  const totalScore =
    recencyScore * scoring.recencyWeight +
    underuseScore * scoring.underuseWeight +
    overusePenalty * scoring.overuseWeight +
    formalityScore * scoring.formalityWeight +
    confidenceScore * scoring.confidenceWeight;

  return {
    itemId: item.id,
    category: item.category,
    score: totalScore,
    daysSinceWorn,
    timesWorn: item.timesWorn,
    formalityScore: item.formalityScore,
    dominantColor: item.dominantColor,
  };
}

// ─── STEP 3: Build valid combinations ──────────────────────────────────

export function buildCombinations(
  scoredItems: ScoredItem[],
  maxCombinations: number = outfit.topCombinationsCount * 10
): OutfitCombination[] {
  const itemsByCategory = new Map<string, ScoredItem[]>();

  for (const item of scoredItems) {
    const existing = itemsByCategory.get(item.category) ?? [];
    existing.push(item);
    itemsByCategory.set(item.category, existing);
  }

  // Sort items within each category by score (desc)
  itemsByCategory.forEach((items, cat) => {
    itemsByCategory.set(
      cat,
      items.sort((a, b) => b.score - a.score)
    );
  });

  // Check required categories exist
  const requiredCats = outfit.requiredCategories;
  for (const cat of requiredCats) {
    if (!itemsByCategory.has(cat) || itemsByCategory.get(cat)!.length === 0) {
      return []; // Cannot build valid outfits without all required categories
    }
  }

  const tops = itemsByCategory.get("top")?.slice(0, 5) ?? [];
  const bottoms = itemsByCategory.get("bottom")?.slice(0, 5) ?? [];
  const shoes = itemsByCategory.get("shoes")?.slice(0, 3) ?? [];

  // Optional items: take top 2 from each optional category
  const optionalItems: ScoredItem[][] = [];
  for (const cat of outfit.optionalCategories) {
    const items = itemsByCategory.get(cat)?.slice(0, 2) ?? [];
    if (items.length > 0) {
      optionalItems.push(items);
    }
  }

  const combinations: OutfitCombination[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        if (combinations.length >= maxCombinations) break;

        const baseItems = [top, bottom, shoe];
        const colors = baseItems.map((i) => i.dominantColor);
        const colorHarmony = calculateCombinationColorHarmony(colors);
        const formalityValues = baseItems.map((i) => i.formalityScore);
        const formalityCoherence = calculateFormalityCoherence(formalityValues);
        const totalScore =
          baseItems.reduce((sum, i) => sum + i.score, 0) / baseItems.length;

        // Base combination (no optional items)
        combinations.push({
          items: [...baseItems],
          totalScore:
            totalScore +
            colorHarmony * scoring.colorHarmonyWeight,
          colorHarmonyScore: colorHarmony,
          formalityCoherence,
        });

        // Add one optional item combination if available
        if (optionalItems.length > 0) {
          const bestOptional = optionalItems[0][0];
          const withOptional = [...baseItems, bestOptional];
          const optColors = withOptional.map((i) => i.dominantColor);
          const optColorHarmony = calculateCombinationColorHarmony(optColors);

          combinations.push({
            items: withOptional,
            totalScore:
              withOptional.reduce((sum, i) => sum + i.score, 0) /
                withOptional.length +
              optColorHarmony * scoring.colorHarmonyWeight,
            colorHarmonyScore: optColorHarmony,
            formalityCoherence: calculateFormalityCoherence(
              withOptional.map((i) => i.formalityScore)
            ),
          });
        }
      }
    }
  }

  return combinations;
}

// ─── STEP 4: Rank top N ───────────────────────────────────────────────

export function rankCombinations(
  combinations: OutfitCombination[],
  topN: number = outfit.topCombinationsCount
): OutfitCombination[] {
  return combinations
    .sort((a, b) => {
      // Primary: total score
      const scoreDiff = b.totalScore - a.totalScore;
      if (Math.abs(scoreDiff) > 0.01) return scoreDiff;

      // Tiebreaker: formality coherence
      return b.formalityCoherence - a.formalityCoherence;
    })
    .slice(0, topN);
}

// ─── Helpers ───────────────────────────────────────────────────────────

function calculateFormalityCoherence(formalityValues: number[]): number {
  if (formalityValues.length <= 1) return 1.0;
  const avg =
    formalityValues.reduce((s, v) => s + v, 0) / formalityValues.length;
  const variance =
    formalityValues.reduce((s, v) => s + Math.pow(v - avg, 2), 0) /
    formalityValues.length;
  // Lower variance → higher coherence
  return Math.max(0, 1 - variance / 25);
}
