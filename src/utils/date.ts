/**
 * Date and color utility functions.
 * Pure functions with no side effects.
 */

/** Calculate the number of days between two dates */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(
    Math.abs(date2.getTime() - date1.getTime()) / msPerDay
  );
}

/** Get a date N days from now */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Format date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Normalize a value to 0–1 range */
export function normalize(
  value: number,
  min: number,
  max: number
): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}
