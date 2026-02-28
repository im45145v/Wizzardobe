import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateSchedule } from "@/services/scheduler.service";
import { rankCombinations, buildCombinations, scoreItem, filterEligibleItems } from "@/services/scoring.service";
import { getActiveItemsForLocation } from "@/services/wardrobe.service";
import { getAverageRatingForItems } from "@/services/outfit.service";
import { getScheduledOutfits } from "@/services/outfit.service";
import { getEventsForDateRange } from "@/services/calendar.service";
import { getActiveLocation } from "@/services/location.service";
import { addDays, formatDate } from "@/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = addDays(startDate, 14);

    // Get active location
    const activeLocation = await getActiveLocation(user.id);
    const locationTag = activeLocation?.name ?? "default";

    // Get all data in parallel
    const [allItems, existingOutfits, events] = await Promise.all([
      getActiveItemsForLocation(user.id, locationTag),
      getScheduledOutfits(user.id, startDate, endDate),
      getEventsForDateRange(user.id, startDate, endDate),
    ]);

    // Generate scored combinations
    const eligibleItems = filterEligibleItems(allItems, locationTag);
    const itemIds = eligibleItems.map((i) => i.id);
    const { avgConfidence } = await getAverageRatingForItems(itemIds);

    const scoredItems = eligibleItems.map((item) =>
      scoreItem(item, 5, avgConfidence)
    );
    const allCombinations = buildCombinations(scoredItems);
    const rankedCombinations = rankCombinations(allCombinations);

    // Map existing outfits to schedule entries
    const existingSchedule = existingOutfits.map((outfit) => ({
      date: outfit.scheduledFor ? formatDate(outfit.scheduledFor) : "",
      outfit: outfit.items.length > 0
        ? {
            items: outfit.items.map((oi) => ({
              itemId: oi.wardrobeItemId,
              category: oi.wardrobeItem.category,
              score: 0,
              daysSinceWorn: 0,
              timesWorn: oi.wardrobeItem.timesWorn,
              formalityScore: oi.wardrobeItem.formalityScore,
              dominantColor: oi.wardrobeItem.dominantColor,
            })),
            totalScore: outfit.aestheticScore ?? 0,
            colorHarmonyScore: 0,
            formalityCoherence: 0,
          }
        : null,
      isLocked: outfit.isAccepted,
    }));

    // Map events
    const eventEntries = events.map((event) => ({
      date: formatDate(event.startTime),
      title: event.title,
      formality: event.formality ?? undefined,
    }));

    const schedule = generateSchedule({
      rankedCombinations,
      existingSchedule,
      events: eventEntries,
      startDate,
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
