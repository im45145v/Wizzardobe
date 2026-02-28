import {
  WardrobeItemCreateSchema,
  RatingCreateSchema,
  AIOutfitRankingSchema,
  CalendarEventCreateSchema,
} from "@/types";

describe("Zod validation schemas", () => {
  describe("WardrobeItemCreateSchema", () => {
    it("validates a correct wardrobe item", () => {
      const validItem = {
        name: "Blue Shirt",
        category: "top",
        dominantColor: "blue",
        tags: ["casual", "cotton"],
        season: "all",
        formalityScore: 5,
        locationTag: "home",
      };

      const result = WardrobeItemCreateSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("rejects invalid category", () => {
      const invalid = {
        name: "Item",
        category: "hat",
        dominantColor: "blue",
        season: "all",
        formalityScore: 5,
        locationTag: "home",
      };

      const result = WardrobeItemCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects formality score out of range", () => {
      const invalid = {
        name: "Item",
        category: "top",
        dominantColor: "blue",
        season: "all",
        formalityScore: 15,
        locationTag: "home",
      };

      const result = WardrobeItemCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects empty name", () => {
      const invalid = {
        name: "",
        category: "top",
        dominantColor: "blue",
        season: "all",
        formalityScore: 5,
        locationTag: "home",
      };

      const result = WardrobeItemCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("RatingCreateSchema", () => {
    it("validates a correct rating", () => {
      const valid = {
        outfitId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        rating: 4,
        confidenceRating: 3,
        notes: "Great combo!",
      };

      const result = RatingCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects rating out of range", () => {
      const invalid = {
        outfitId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
        rating: 6,
        confidenceRating: 3,
      };

      const result = RatingCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("AIOutfitRankingSchema", () => {
    it("validates correct AI ranking response", () => {
      const valid = {
        selectedOutfitIndex: 0,
        aestheticScore: 7.5,
        confidencePrediction: 0.85,
        reasoning: "Good color combination",
        rankings: [
          { index: 0, score: 7.5, reasoning: "Best match" },
          { index: 1, score: 6.0, reasoning: "Decent" },
        ],
      };

      const result = AIOutfitRankingSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects selectedOutfitIndex out of range", () => {
      const invalid = {
        selectedOutfitIndex: 10,
        aestheticScore: 7.5,
        confidencePrediction: 0.85,
        reasoning: "Good",
        rankings: [],
      };

      const result = AIOutfitRankingSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("CalendarEventCreateSchema", () => {
    it("validates a correct calendar event", () => {
      const valid = {
        title: "Team Meeting",
        startTime: "2025-03-01T10:00:00Z",
        formality: 7,
      };

      const result = CalendarEventCreateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects formality out of range", () => {
      const invalid = {
        title: "Meeting",
        startTime: "2025-03-01T10:00:00Z",
        formality: 15,
      };

      const result = CalendarEventCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
