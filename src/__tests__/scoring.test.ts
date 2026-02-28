import {
  filterEligibleItems,
  scoreItem,
  buildCombinations,
  rankCombinations,
} from "@/services/scoring.service";
import type { WardrobeItem } from "@prisma/client";

function makeItem(overrides: Partial<WardrobeItem> = {}): WardrobeItem {
  return {
    id: "item-1",
    userId: "user-1",
    name: "Test Item",
    category: "top",
    dominantColor: "blue",
    tags: [],
    season: "all",
    formalityScore: 5,
    timesWorn: 0,
    lastWornAt: null,
    locationTag: "home",
    isActive: true,
    imageUrl: null,
    costPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("scoring service", () => {
  describe("filterEligibleItems", () => {
    it("filters out inactive items", () => {
      const items = [
        makeItem({ id: "1", isActive: true }),
        makeItem({ id: "2", isActive: false }),
      ];
      const result = filterEligibleItems(items, "home");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("filters by location", () => {
      const items = [
        makeItem({ id: "1", locationTag: "home" }),
        makeItem({ id: "2", locationTag: "hostel" }),
      ];
      const result = filterEligibleItems(items, "home");
      expect(result).toHaveLength(1);
    });

    it("filters by season, keeping 'all' season items", () => {
      const items = [
        makeItem({ id: "1", season: "summer" }),
        makeItem({ id: "2", season: "winter" }),
        makeItem({ id: "3", season: "all" }),
      ];
      const result = filterEligibleItems(items, "home", "summer");
      expect(result).toHaveLength(2);
    });

    it("excludes recently worn items", () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1); // 1 day ago
      const items = [
        makeItem({ id: "1", lastWornAt: recentDate }),
        makeItem({ id: "2", lastWornAt: null }),
      ];
      const result = filterEligibleItems(items, "home");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });
  });

  describe("scoreItem", () => {
    it("scores never-worn items higher than frequently worn", () => {
      const neverWorn = makeItem({ timesWorn: 0, lastWornAt: null });
      const wornALot = makeItem({
        timesWorn: 10,
        lastWornAt: new Date(),
      });

      const scoreNever = scoreItem(neverWorn, 5, 3);
      const scoreWorn = scoreItem(wornALot, 5, 3);

      expect(scoreNever.score).toBeGreaterThan(scoreWorn.score);
    });

    it("gives higher score when formality matches target", () => {
      const matching = makeItem({ formalityScore: 5 });
      const mismatched = makeItem({ formalityScore: 10 });

      const scoreMatch = scoreItem(matching, 5, 3);
      const scoreMismatch = scoreItem(mismatched, 5, 3);

      expect(scoreMatch.score).toBeGreaterThan(scoreMismatch.score);
    });

    it("returns a ScoredItem with correct fields", () => {
      const item = makeItem({ id: "test-id", category: "top" });
      const scored = scoreItem(item, 5, 3);

      expect(scored.itemId).toBe("test-id");
      expect(scored.category).toBe("top");
      expect(typeof scored.score).toBe("number");
      expect(scored.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("buildCombinations", () => {
    it("returns empty if required categories are missing", () => {
      const scoredItems = [
        { itemId: "1", category: "top", score: 0.8, daysSinceWorn: 5, timesWorn: 1, formalityScore: 5, dominantColor: "blue" },
      ];
      const combos = buildCombinations(scoredItems);
      expect(combos).toHaveLength(0);
    });

    it("builds combinations with all required categories", () => {
      const scoredItems = [
        { itemId: "1", category: "top", score: 0.8, daysSinceWorn: 5, timesWorn: 1, formalityScore: 5, dominantColor: "blue" },
        { itemId: "2", category: "bottom", score: 0.7, daysSinceWorn: 3, timesWorn: 2, formalityScore: 5, dominantColor: "black" },
        { itemId: "3", category: "shoes", score: 0.6, daysSinceWorn: 7, timesWorn: 1, formalityScore: 5, dominantColor: "white" },
      ];
      const combos = buildCombinations(scoredItems);
      expect(combos.length).toBeGreaterThan(0);
      expect(combos[0].items).toHaveLength(3);
    });

    it("includes optional items in some combinations", () => {
      const scoredItems = [
        { itemId: "1", category: "top", score: 0.8, daysSinceWorn: 5, timesWorn: 1, formalityScore: 5, dominantColor: "blue" },
        { itemId: "2", category: "bottom", score: 0.7, daysSinceWorn: 3, timesWorn: 2, formalityScore: 5, dominantColor: "black" },
        { itemId: "3", category: "shoes", score: 0.6, daysSinceWorn: 7, timesWorn: 1, formalityScore: 5, dominantColor: "white" },
        { itemId: "4", category: "accessory", score: 0.5, daysSinceWorn: 10, timesWorn: 0, formalityScore: 5, dominantColor: "gold" },
      ];
      const combos = buildCombinations(scoredItems);
      const withOptional = combos.filter((c) => c.items.length > 3);
      expect(withOptional.length).toBeGreaterThan(0);
    });
  });

  describe("rankCombinations", () => {
    it("returns top N combinations sorted by score", () => {
      const combos = [
        { items: [], totalScore: 0.5, colorHarmonyScore: 0.5, formalityCoherence: 0.5 },
        { items: [], totalScore: 0.9, colorHarmonyScore: 0.8, formalityCoherence: 0.9 },
        { items: [], totalScore: 0.3, colorHarmonyScore: 0.3, formalityCoherence: 0.3 },
      ];

      const ranked = rankCombinations(combos, 2);
      expect(ranked).toHaveLength(2);
      expect(ranked[0].totalScore).toBe(0.9);
      expect(ranked[1].totalScore).toBe(0.5);
    });
  });
});
