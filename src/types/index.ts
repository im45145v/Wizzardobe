import { z } from "zod";

// ─── Category & Season enums ───────────────────────────────────────────

export const CategoryEnum = z.enum([
  "top",
  "bottom",
  "shoes",
  "accessory",
  "watch",
  "bag",
  "jacket",
]);

export const SeasonEnum = z.enum([
  "spring",
  "summer",
  "fall",
  "winter",
  "all",
]);

export const GeneratedByEnum = z.enum(["ai", "manual", "scheduler"]);

// ─── WardrobeItem ──────────────────────────────────────────────────────

export const WardrobeItemCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: CategoryEnum,
  dominantColor: z.string().min(1).max(50),
  tags: z.array(z.string()).default([]),
  season: SeasonEnum,
  formalityScore: z.number().int().min(1).max(10),
  locationTag: z.string().min(1).max(50),
  imageUrl: z.string().url().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const WardrobeItemUpdateSchema = WardrobeItemCreateSchema.partial();

export type WardrobeItemCreate = z.infer<typeof WardrobeItemCreateSchema>;
export type WardrobeItemUpdate = z.infer<typeof WardrobeItemUpdateSchema>;

// ─── Outfit ────────────────────────────────────────────────────────────

export const OutfitCreateSchema = z.object({
  generatedBy: GeneratedByEnum,
  itemIds: z.array(z.string().cuid()).min(1),
  aestheticScore: z.number().min(0).max(10).optional(),
  confidencePrediction: z.number().min(0).max(1).optional(),
  reasoning: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export type OutfitCreate = z.infer<typeof OutfitCreateSchema>;

// ─── Rating ────────────────────────────────────────────────────────────

export const RatingCreateSchema = z.object({
  outfitId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  confidenceRating: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
});

export type RatingCreate = z.infer<typeof RatingCreateSchema>;

// ─── AI Response Schemas ───────────────────────────────────────────────

export const AIOutfitRankingSchema = z.object({
  selectedOutfitIndex: z.number().int().min(0).max(4),
  aestheticScore: z.number().min(0).max(10),
  confidencePrediction: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(500),
  rankings: z.array(
    z.object({
      index: z.number().int(),
      score: z.number().min(0).max(10),
      reasoning: z.string(),
    })
  ),
});

export type AIOutfitRanking = z.infer<typeof AIOutfitRankingSchema>;

export const AIStyleProfileSchema = z.object({
  dominantStyle: z.string(),
  colorPreferences: z.array(z.string()),
  formalityTendency: z.number().min(1).max(10),
  suggestions: z.array(z.string()).max(5),
});

export type AIStyleProfile = z.infer<typeof AIStyleProfileSchema>;

// ─── Calendar Event ────────────────────────────────────────────────────

export const CalendarEventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  eventType: z.string().max(50).optional(),
  formality: z.number().int().min(1).max(10).optional(),
});

export type CalendarEventCreate = z.infer<typeof CalendarEventCreateSchema>;

// ─── Location Profile ──────────────────────────────────────────────────

export const LocationProfileCreateSchema = z.object({
  name: z.string().min(1).max(50),
  isActive: z.boolean().default(true),
});

export type LocationProfileCreate = z.infer<
  typeof LocationProfileCreateSchema
>;

// ─── Analytics Types ───────────────────────────────────────────────────

export interface ItemUsageAnalytics {
  itemId: string;
  itemName: string;
  category: string;
  timesWorn: number;
  costPrice: number | null;
  costPerWear: number | null;
}

export interface ColorFrequency {
  color: string;
  count: number;
  percentage: number;
}

export interface FormalityDistribution {
  score: number;
  count: number;
}

export interface AnalyticsSummary {
  totalItems: number;
  activeItems: number;
  totalOutfits: number;
  mostUsedItems: ItemUsageAnalytics[];
  underusedItems: ItemUsageAnalytics[];
  colorFrequency: ColorFrequency[];
  formalityDistribution: FormalityDistribution[];
}

// ─── Scored Item (internal) ────────────────────────────────────────────

export interface ScoredItem {
  itemId: string;
  category: string;
  score: number;
  daysSinceWorn: number;
  timesWorn: number;
  formalityScore: number;
  dominantColor: string;
}

export interface OutfitCombination {
  items: ScoredItem[];
  totalScore: number;
  colorHarmonyScore: number;
  formalityCoherence: number;
}

// ─── Schedule Entry ────────────────────────────────────────────────────

export interface ScheduleEntry {
  date: string;
  outfit: OutfitCombination | null;
  eventTitle?: string;
  eventFormality?: number;
  isLocked: boolean;
}
