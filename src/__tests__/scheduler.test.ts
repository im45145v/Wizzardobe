import { generateSchedule } from "@/services/scheduler.service";
import type { OutfitCombination, ScheduleEntry } from "@/types";

function makeCombination(
  id: string,
  color: string = "blue",
  score: number = 0.8
): OutfitCombination {
  return {
    items: [
      { itemId: `top-${id}`, category: "top", score, daysSinceWorn: 5, timesWorn: 1, formalityScore: 5, dominantColor: color },
      { itemId: `bottom-${id}`, category: "bottom", score: score - 0.1, daysSinceWorn: 3, timesWorn: 2, formalityScore: 5, dominantColor: "black" },
      { itemId: `shoes-${id}`, category: "shoes", score: score - 0.2, daysSinceWorn: 7, timesWorn: 1, formalityScore: 5, dominantColor: "white" },
    ],
    totalScore: score,
    colorHarmonyScore: 0.7,
    formalityCoherence: 0.8,
  };
}

describe("scheduler service", () => {
  const startDate = new Date("2025-03-01T00:00:00Z");

  it("generates a 14-day schedule", () => {
    const combos = [
      makeCombination("1", "blue", 0.9),
      makeCombination("2", "red", 0.8),
      makeCombination("3", "green", 0.7),
    ];

    const schedule = generateSchedule({
      rankedCombinations: combos,
      existingSchedule: [],
      events: [],
      startDate,
    });

    expect(schedule).toHaveLength(14);
  });

  it("generates empty schedule when no combinations available", () => {
    const schedule = generateSchedule({
      rankedCombinations: [],
      existingSchedule: [],
      events: [],
      startDate,
    });

    expect(schedule).toHaveLength(14);
    schedule.forEach((entry) => {
      expect(entry.outfit).toBeNull();
    });
  });

  it("preserves locked entries", () => {
    const lockedEntry: ScheduleEntry = {
      date: "2025-03-01",
      outfit: makeCombination("locked"),
      isLocked: true,
    };

    const combos = [makeCombination("1")];

    const schedule = generateSchedule({
      rankedCombinations: combos,
      existingSchedule: [lockedEntry],
      events: [],
      startDate,
    });

    expect(schedule[0].isLocked).toBe(true);
  });

  it("includes event information in schedule", () => {
    const events = [
      { date: "2025-03-05", title: "Business Meeting", formality: 8 },
    ];

    const combos = [makeCombination("1")];

    const schedule = generateSchedule({
      rankedCombinations: combos,
      existingSchedule: [],
      events,
      startDate,
    });

    const eventDay = schedule.find((e) => e.date === "2025-03-05");
    expect(eventDay?.eventTitle).toBe("Business Meeting");
    expect(eventDay?.eventFormality).toBe(8);
  });

  it("assigns outfits to all days when combinations exist", () => {
    const combos = [
      makeCombination("1", "blue"),
      makeCombination("2", "red"),
    ];

    const schedule = generateSchedule({
      rankedCombinations: combos,
      existingSchedule: [],
      events: [],
      startDate,
    });

    const daysWithOutfit = schedule.filter((e) => e.outfit !== null);
    expect(daysWithOutfit.length).toBe(14);
  });
});
