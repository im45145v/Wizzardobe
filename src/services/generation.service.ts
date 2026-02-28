import {
  filterEligibleItems,
  scoreItem,
  buildCombinations,
  rankCombinations,
} from "./scoring.service";
import { getActiveItemsForLocation } from "./wardrobe.service";
import { getAverageRatingForItems } from "./outfit.service";
import { rankOutfitsWithAI } from "@/ai/outfitRanker";
import type { OutfitCombination } from "@/types";

/**
 * Outfit generation orchestrator.
 *
 * Coordinates the full pipeline:
 *   Filter → Score → Combine → Rank (deterministic) → Re-rank (AI)
 */

interface GenerationOptions {
  userId: string;
  locationTag: string;
  targetFormality?: number;
  currentSeason?: string;
  useAI?: boolean;
}

export interface GenerationResult {
  combinations: OutfitCombination[];
  selectedIndex: number;
  aiReasoning?: string;
  aestheticScore?: number;
  confidencePrediction?: number;
}

export async function generateOutfitRecommendations(
  options: GenerationOptions
): Promise<GenerationResult> {
  const {
    userId,
    locationTag,
    targetFormality = 5,
    currentSeason,
    useAI = false,
  } = options;

  // STEP 1: Get eligible items
  const allItems = await getActiveItemsForLocation(userId, locationTag);
  const eligibleItems = filterEligibleItems(
    allItems,
    locationTag,
    currentSeason
  );

  if (eligibleItems.length === 0) {
    return { combinations: [], selectedIndex: -1 };
  }

  // STEP 2: Score each item
  const itemIds = eligibleItems.map((i) => i.id);
  const { avgConfidence } = await getAverageRatingForItems(itemIds);

  const scoredItems = eligibleItems.map((item) =>
    scoreItem(item, targetFormality, avgConfidence)
  );

  // STEP 3: Build combinations
  const allCombinations = buildCombinations(scoredItems);

  if (allCombinations.length === 0) {
    return { combinations: [], selectedIndex: -1 };
  }

  // STEP 4: Rank top 5 deterministically
  const topCombinations = rankCombinations(allCombinations);

  // STEP 5: Optional AI re-ranking
  if (useAI && topCombinations.length > 0) {
    try {
      const aiResult = await rankOutfitsWithAI(topCombinations);
      return {
        combinations: topCombinations,
        selectedIndex: aiResult.selectedOutfitIndex,
        aiReasoning: aiResult.reasoning,
        aestheticScore: aiResult.aestheticScore,
        confidencePrediction: aiResult.confidencePrediction,
      };
    } catch (error) {
      // AI failed, fall back to deterministic ranking
      console.warn("AI re-ranking failed, using deterministic fallback:", error);
      return {
        combinations: topCombinations,
        selectedIndex: 0,
      };
    }
  }

  return {
    combinations: topCombinations,
    selectedIndex: 0,
  };
}
