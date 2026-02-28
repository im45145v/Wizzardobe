import { prisma } from "@/db/client";
import type { WardrobeItemCreate, WardrobeItemUpdate } from "@/types";

/**
 * Wardrobe service: handles all wardrobe item CRUD operations.
 * No business logic beyond data access lives here.
 */

export async function getItemsByUser(
  userId: string,
  filters?: {
    category?: string;
    locationTag?: string;
    isActive?: boolean;
    season?: string;
  }
) {
  return prisma.wardrobeItem.findMany({
    where: {
      userId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.locationTag && { locationTag: filters.locationTag }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.season && {
        OR: [{ season: filters.season }, { season: "all" }],
      }),
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getItemById(id: string, userId: string) {
  return prisma.wardrobeItem.findFirst({
    where: { id, userId },
    include: {
      usageLogs: { orderBy: { wornAt: "desc" }, take: 10 },
    },
  });
}

export async function createItem(userId: string, data: WardrobeItemCreate) {
  return prisma.wardrobeItem.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateItem(
  id: string,
  userId: string,
  data: WardrobeItemUpdate
) {
  return prisma.wardrobeItem.updateMany({
    where: { id, userId },
    data,
  });
}

export async function toggleItemActive(id: string, userId: string) {
  const item = await prisma.wardrobeItem.findFirst({
    where: { id, userId },
    select: { isActive: true },
  });

  if (!item) return null;

  return prisma.wardrobeItem.update({
    where: { id },
    data: { isActive: !item.isActive },
  });
}

export async function recordUsage(
  itemId: string,
  outfitId: string | null,
  wornAt: Date = new Date()
) {
  return prisma.$transaction([
    prisma.usageLog.create({
      data: {
        itemId,
        outfitId,
        wornAt,
      },
    }),
    prisma.wardrobeItem.update({
      where: { id: itemId },
      data: {
        timesWorn: { increment: 1 },
        lastWornAt: wornAt,
      },
    }),
  ]);
}

export async function getActiveItemsForLocation(
  userId: string,
  locationTag: string
) {
  return prisma.wardrobeItem.findMany({
    where: {
      userId,
      isActive: true,
      locationTag,
    },
    orderBy: { lastWornAt: "asc" },
  });
}
