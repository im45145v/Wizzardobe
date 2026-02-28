import { APP_CONFIG } from "@/config";

/**
 * Color utility functions for harmony scoring.
 */

/** Find the harmony group index for a color */
export function findColorGroup(color: string): number {
  const normalized = color.toLowerCase().trim();
  return APP_CONFIG.colorHarmonyGroups.findIndex((group) =>
    group.some((c) => normalized.includes(c) || c.includes(normalized))
  );
}

/** Score color harmony between two colors (0–1, higher = more harmonious) */
export function scoreColorHarmony(color1: string, color2: string): number {
  const group1 = findColorGroup(color1);
  const group2 = findColorGroup(color2);

  // Both in same group → high harmony
  if (group1 !== -1 && group1 === group2) return 1.0;

  // Neutrals (black, white, gray) go with everything
  const neutralGroup = 0; // first group is neutrals
  if (group1 === neutralGroup || group2 === neutralGroup) return 0.9;

  // Adjacent groups have decent harmony
  if (group1 !== -1 && group2 !== -1) {
    const distance = Math.abs(group1 - group2);
    if (distance <= 2) return 0.7;
    return 0.4;
  }

  // Unknown colors get neutral score
  return 0.5;
}

/** Calculate average color harmony across all items in a combination */
export function calculateCombinationColorHarmony(
  colors: string[]
): number {
  if (colors.length <= 1) return 1.0;

  let totalScore = 0;
  let pairs = 0;

  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      totalScore += scoreColorHarmony(colors[i], colors[j]);
      pairs++;
    }
  }

  return pairs > 0 ? totalScore / pairs : 0.5;
}
