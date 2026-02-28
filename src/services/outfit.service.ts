import { prisma } from "@/db/client";
import type { OutfitCreate, RatingCreate } from "@/types";

/**
 * Outfit service: handles outfit CRUD and ratings.
 */

export async function createOutfit(userId: string, data: OutfitCreate) {
  const { itemIds, ...outfitData } = data;

  return prisma.outfit.create({
    data: {
      ...outfitData,
      userId,
      isScheduled: !!data.scheduledFor,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      items: {
        create: itemIds.map((wardrobeItemId) => ({
          wardrobeItemId,
        })),
      },
    },
    include: {
      items: {
        include: { wardrobeItem: true },
      },
    },
  });
}

export async function getOutfitById(id: string, userId: string) {
  return prisma.outfit.findFirst({
    where: { id, userId },
    include: {
      items: {
        include: { wardrobeItem: true },
      },
      ratingLogs: true,
    },
  });
}

export async function getOutfitsByUser(
  userId: string,
  options?: {
    isScheduled?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  return prisma.outfit.findMany({
    where: {
      userId,
      ...(options?.isScheduled !== undefined && {
        isScheduled: options.isScheduled,
      }),
    },
    include: {
      items: {
        include: { wardrobeItem: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 20,
    skip: options?.offset ?? 0,
  });
}

export async function getScheduledOutfits(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.outfit.findMany({
    where: {
      userId,
      isScheduled: true,
      scheduledFor: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      items: {
        include: { wardrobeItem: true },
      },
    },
    orderBy: { scheduledFor: "asc" },
  });
}

export async function acceptOutfit(id: string, userId: string) {
  return prisma.outfit.updateMany({
    where: { id, userId },
    data: { isAccepted: true },
  });
}

export async function rateOutfit(data: RatingCreate) {
  return prisma.ratingLog.create({ data });
}

export async function getAverageRatingForItems(itemIds: string[]) {
  const ratings = await prisma.ratingLog.findMany({
    where: {
      outfit: {
        items: {
          some: {
            wardrobeItemId: { in: itemIds },
          },
        },
      },
    },
    select: {
      rating: true,
      confidenceRating: true,
    },
  });

  if (ratings.length === 0) return { avgRating: 0, avgConfidence: 0 };

  const avgRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  const avgConfidence =
    ratings.reduce((sum, r) => sum + r.confidenceRating, 0) / ratings.length;

  return { avgRating, avgConfidence };
}
