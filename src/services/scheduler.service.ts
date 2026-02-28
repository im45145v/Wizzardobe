import { APP_CONFIG } from "@/config";
import type { OutfitCombination, ScheduleEntry } from "@/types";
import { addDays, formatDate } from "@/utils";

const { scheduler } = APP_CONFIG;

/**
 * 14-day scheduling engine.
 *
 * Generates a schedule that:
 * - Avoids repeating identical outfits within minDaysBetweenIdenticalOutfits
 * - Avoids back-to-back heavy repetition of dominant colors
 * - Respects calendar event formality
 * - Is fully deterministic
 */

interface ScheduleInput {
  rankedCombinations: OutfitCombination[];
  existingSchedule: ScheduleEntry[];
  events: Array<{
    date: string;
    title: string;
    formality?: number;
  }>;
  startDate: Date;
}

export function generateSchedule(input: ScheduleInput): ScheduleEntry[] {
  const { rankedCombinations, existingSchedule, events, startDate } = input;

  if (rankedCombinations.length === 0) {
    return createEmptySchedule(startDate, events);
  }

  const schedule: ScheduleEntry[] = [];
  const usedOutfitHistory: Array<{
    date: string;
    items: string[];
    dominantColor: string;
  }> = [];

  // Preserve locked entries from existing schedule
  const lockedEntries = new Map<string, ScheduleEntry>();
  for (const entry of existingSchedule) {
    if (entry.isLocked) {
      lockedEntries.set(entry.date, entry);
    }
  }

  for (let day = 0; day < scheduler.forecastDays; day++) {
    const date = addDays(startDate, day);
    const dateStr = formatDate(date);

    // Use locked entry if it exists
    if (lockedEntries.has(dateStr)) {
      const locked = lockedEntries.get(dateStr)!;
      schedule.push(locked);
      if (locked.outfit) {
        usedOutfitHistory.push({
          date: dateStr,
          items: locked.outfit.items.map((i) => i.itemId),
          dominantColor: getMostFrequentColor(locked.outfit),
        });
      }
      continue;
    }

    // Find event for this date
    const dayEvent = events.find((e) => e.date === dateStr);
    const targetFormality = dayEvent?.formality;

    // Select best outfit for this day
    const selectedOutfit = selectOutfitForDay(
      rankedCombinations,
      usedOutfitHistory,
      dateStr,
      targetFormality
    );

    schedule.push({
      date: dateStr,
      outfit: selectedOutfit,
      eventTitle: dayEvent?.title,
      eventFormality: dayEvent?.formality,
      isLocked: false,
    });

    if (selectedOutfit) {
      usedOutfitHistory.push({
        date: dateStr,
        items: selectedOutfit.items.map((i) => i.itemId),
        dominantColor: getMostFrequentColor(selectedOutfit),
      });
    }
  }

  return schedule;
}

function selectOutfitForDay(
  combinations: OutfitCombination[],
  history: Array<{ date: string; items: string[]; dominantColor: string }>,
  currentDate: string,
  targetFormality?: number
): OutfitCombination | null {
  let bestOutfit: OutfitCombination | null = null;
  let bestScore = -Infinity;

  for (const combo of combinations) {
    let score = combo.totalScore;

    // Penalty for identical outfits too close together
    const identicalPenalty = calculateIdenticalPenalty(
      combo,
      history,
      currentDate
    );
    score -= identicalPenalty;

    // Penalty for consecutive same dominant color
    const colorPenalty = calculateColorRepetitionPenalty(
      combo,
      history
    );
    score -= colorPenalty;

    // Formality bonus/penalty if event exists
    if (targetFormality !== undefined) {
      const avgFormality =
        combo.items.reduce((sum, i) => sum + i.formalityScore, 0) /
        combo.items.length;
      const formalityDiff = Math.abs(avgFormality - targetFormality);
      score -= formalityDiff * 0.1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestOutfit = combo;
    }
  }

  return bestOutfit;
}

function calculateIdenticalPenalty(
  combo: OutfitCombination,
  history: Array<{ date: string; items: string[] }>,
  currentDate: string
): number {
  const comboItemIds = new Set(combo.items.map((i) => i.itemId));

  for (const entry of history) {
    const entryDate = new Date(entry.date);
    const current = new Date(currentDate);
    const daysDiff = Math.abs(
      Math.floor(
        (current.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    if (daysDiff < scheduler.minDaysBetweenIdenticalOutfits) {
      const entryItemIds = new Set(entry.items);
      const overlap = Array.from(comboItemIds).filter((id) =>
        entryItemIds.has(id)
      ).length;
      const overlapRatio = overlap / comboItemIds.size;

      if (overlapRatio > 0.7) {
        return 2.0 * overlapRatio;
      }
      if (overlapRatio > 0.3) {
        return 0.5 * overlapRatio;
      }
    }
  }

  return 0;
}

function calculateColorRepetitionPenalty(
  combo: OutfitCombination,
  history: Array<{ dominantColor: string }>
): number {
  if (history.length === 0) return 0;

  const comboColor = getMostFrequentColor(combo);
  const recentColors = history
    .slice(-scheduler.maxConsecutiveSameColor)
    .map((h) => h.dominantColor);

  const consecutiveSame = recentColors.filter(
    (c) => c === comboColor
  ).length;

  if (consecutiveSame >= scheduler.maxConsecutiveSameColor) {
    return 1.0;
  }

  return consecutiveSame * 0.3;
}

function getMostFrequentColor(combo: OutfitCombination): string {
  const colorCounts = new Map<string, number>();
  for (const item of combo.items) {
    const count = colorCounts.get(item.dominantColor) ?? 0;
    colorCounts.set(item.dominantColor, count + 1);
  }

  let maxColor = combo.items[0]?.dominantColor ?? "unknown";
  let maxCount = 0;
  colorCounts.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count;
      maxColor = color;
    }
  });

  return maxColor;
}

function createEmptySchedule(
  startDate: Date,
  events: Array<{ date: string; title: string; formality?: number }>
): ScheduleEntry[] {
  const schedule: ScheduleEntry[] = [];
  for (let day = 0; day < scheduler.forecastDays; day++) {
    const date = addDays(startDate, day);
    const dateStr = formatDate(date);
    const dayEvent = events.find((e) => e.date === dateStr);
    schedule.push({
      date: dateStr,
      outfit: null,
      eventTitle: dayEvent?.title,
      eventFormality: dayEvent?.formality,
      isLocked: false,
    });
  }
  return schedule;
}
