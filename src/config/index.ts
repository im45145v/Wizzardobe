/**
 * Centralized application configuration.
 * All magic numbers and tunable parameters live here.
 */

export const APP_CONFIG = {
  /** Outfit generation constraints */
  outfit: {
    /** Minimum days before an item can be re-suggested */
    recentWornThresholdDays: 3,
    /** Target reuse window in days */
    reuseWindowDays: 10,
    /** Minimum times each item should be worn */
    minReuseCount: 2,
    /** Maximum times an item should be worn before penalty */
    maxReuseCount: 8,
    /** Number of top combinations to generate deterministically */
    topCombinationsCount: 5,
    /** Required categories for a complete outfit */
    requiredCategories: ["top", "bottom", "shoes"] as const,
    /** Optional categories */
    optionalCategories: ["accessory", "watch", "bag", "jacket"] as const,
  },

  /** Scoring weights for deterministic ranking */
  scoring: {
    /** Weight for days since last worn (higher = prefer less recent) */
    recencyWeight: 0.3,
    /** Weight for underuse boost */
    underuseWeight: 0.25,
    /** Weight for overuse penalty */
    overuseWeight: 0.15,
    /** Weight for formality match */
    formalityWeight: 0.15,
    /** Weight for color harmony */
    colorHarmonyWeight: 0.1,
    /** Weight for historical confidence */
    confidenceWeight: 0.05,
  },

  /** Scheduling constraints */
  scheduler: {
    /** Number of days to plan ahead */
    forecastDays: 14,
    /** Minimum days between identical outfits */
    minDaysBetweenIdenticalOutfits: 7,
    /** Maximum consecutive days with same dominant color */
    maxConsecutiveSameColor: 2,
  },

  /** AI integration settings */
  ai: {
    /** OpenAI model to use */
    model: "gpt-4o-mini" as const,
    /** Temperature for deterministic outputs */
    temperature: 0.3,
    /** Maximum tokens for response */
    maxTokens: 1000,
    /** Number of retries on invalid JSON */
    maxRetries: 1,
  },

  /** Categories and their formality ranges */
  categories: {
    top: { label: "Top", formalityRange: [1, 10] },
    bottom: { label: "Bottom", formalityRange: [1, 10] },
    shoes: { label: "Shoes", formalityRange: [1, 10] },
    accessory: { label: "Accessory", formalityRange: [1, 10] },
    watch: { label: "Watch", formalityRange: [1, 10] },
    bag: { label: "Bag", formalityRange: [1, 10] },
    jacket: { label: "Jacket", formalityRange: [1, 10] },
  } as const,

  /** Season options */
  seasons: ["spring", "summer", "fall", "winter", "all"] as const,

  /** Color harmony groups for scoring */
  colorHarmonyGroups: [
    ["black", "white", "gray", "charcoal"],
    ["navy", "blue", "lightblue", "denim"],
    ["brown", "tan", "beige", "cream", "khaki"],
    ["red", "burgundy", "maroon", "wine"],
    ["green", "olive", "sage", "forest"],
    ["pink", "rose", "coral", "salmon"],
    ["purple", "lavender", "plum", "violet"],
    ["orange", "rust", "terracotta", "peach"],
    ["yellow", "gold", "mustard", "lemon"],
  ],
} as const;

export type Category = keyof typeof APP_CONFIG.categories;
export type Season = (typeof APP_CONFIG.seasons)[number];
