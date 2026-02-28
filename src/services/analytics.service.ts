import { prisma } from "@/db/client";
import type {
  AnalyticsSummary,
  ItemUsageAnalytics,
  ColorFrequency,
  FormalityDistribution,
} from "@/types";

/**
 * Analytics engine.
 * Efficient database queries for wardrobe analytics.
 */

export async function getAnalyticsSummary(
  userId: string
): Promise<AnalyticsSummary> {
  const [
    totalItems,
    activeItems,
    totalOutfits,
    mostUsedItems,
    underusedItems,
    colorFrequency,
    formalityDistribution,
  ] = await Promise.all([
    getTotalItemCount(userId),
    getActiveItemCount(userId),
    getTotalOutfitCount(userId),
    getMostUsedItems(userId, 10),
    getUnderusedItems(userId, 10),
    getColorFrequency(userId),
    getFormalityDistribution(userId),
  ]);

  return {
    totalItems,
    activeItems,
    totalOutfits,
    mostUsedItems,
    underusedItems,
    colorFrequency,
    formalityDistribution,
  };
}

async function getTotalItemCount(userId: string): Promise<number> {
  return prisma.wardrobeItem.count({ where: { userId } });
}

async function getActiveItemCount(userId: string): Promise<number> {
  return prisma.wardrobeItem.count({ where: { userId, isActive: true } });
}

async function getTotalOutfitCount(userId: string): Promise<number> {
  return prisma.outfit.count({ where: { userId } });
}

export async function getMostUsedItems(
  userId: string,
  limit: number = 10
): Promise<ItemUsageAnalytics[]> {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId },
    orderBy: { timesWorn: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      category: true,
      timesWorn: true,
      costPrice: true,
    },
  });

  return items.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    timesWorn: item.timesWorn,
    costPrice: item.costPrice,
    costPerWear:
      item.costPrice && item.timesWorn > 0
        ? Math.round((item.costPrice / item.timesWorn) * 100) / 100
        : null,
  }));
}

export async function getUnderusedItems(
  userId: string,
  limit: number = 10
): Promise<ItemUsageAnalytics[]> {
  const items = await prisma.wardrobeItem.findMany({
    where: {
      userId,
      isActive: true,
      timesWorn: { lt: 3 },
    },
    orderBy: { timesWorn: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      category: true,
      timesWorn: true,
      costPrice: true,
    },
  });

  return items.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    category: item.category,
    timesWorn: item.timesWorn,
    costPrice: item.costPrice,
    costPerWear:
      item.costPrice && item.timesWorn > 0
        ? Math.round((item.costPrice / item.timesWorn) * 100) / 100
        : null,
  }));
}

export async function getColorFrequency(
  userId: string
): Promise<ColorFrequency[]> {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true },
    select: { dominantColor: true },
  });

  const colorCounts = new Map<string, number>();
  for (const item of items) {
    const color = item.dominantColor.toLowerCase();
    colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
  }

  const total = items.length;
  return Array.from(colorCounts.entries())
    .map(([color, count]) => ({
      color,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getFormalityDistribution(
  userId: string
): Promise<FormalityDistribution[]> {
  const items = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true },
    select: { formalityScore: true },
  });

  const distribution = new Map<number, number>();
  for (let i = 1; i <= 10; i++) {
    distribution.set(i, 0);
  }

  for (const item of items) {
    const current = distribution.get(item.formalityScore) ?? 0;
    distribution.set(item.formalityScore, current + 1);
  }

  return Array.from(distribution.entries()).map(([score, count]) => ({
    score,
    count,
  }));
}
