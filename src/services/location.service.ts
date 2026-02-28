import { prisma } from "@/db/client";

/**
 * Location profile service.
 */

export async function getLocationProfiles(userId: string) {
  return prisma.locationProfile.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function getActiveLocation(userId: string) {
  return prisma.locationProfile.findFirst({
    where: { userId, isActive: true },
  });
}

export async function createLocationProfile(
  userId: string,
  name: string
) {
  return prisma.locationProfile.create({
    data: { userId, name },
  });
}

export async function toggleLocationActive(
  id: string,
  userId: string
) {
  const profile = await prisma.locationProfile.findFirst({
    where: { id, userId },
    select: { isActive: true },
  });

  if (!profile) return null;

  // Deactivate all other profiles first, then activate this one
  if (!profile.isActive) {
    await prisma.locationProfile.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  return prisma.locationProfile.update({
    where: { id },
    data: { isActive: !profile.isActive },
  });
}
