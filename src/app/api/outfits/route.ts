import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getOutfitsByUser,
  createOutfit,
  rateOutfit,
} from "@/services/outfit.service";
import { generateOutfitRecommendations } from "@/services/generation.service";
import { OutfitCreateSchema, RatingCreateSchema } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const options = {
      isScheduled: searchParams.has("scheduled")
        ? searchParams.get("scheduled") === "true"
        : undefined,
      limit: searchParams.has("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : undefined,
      offset: searchParams.has("offset")
        ? parseInt(searchParams.get("offset")!, 10)
        : undefined,
    };

    const outfits = await getOutfitsByUser(user.id, options);
    return NextResponse.json({ outfits });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // Check if this is a generation request or a manual creation
    if (body.action === "generate") {
      const result = await generateOutfitRecommendations({
        userId: user.id,
        locationTag: body.locationTag ?? "default",
        targetFormality: body.targetFormality,
        currentSeason: body.currentSeason,
        useAI: body.useAI ?? false,
      });

      return NextResponse.json({ result });
    }

    if (body.action === "rate") {
      const validation = RatingCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validation.error.flatten(),
          },
          { status: 400 }
        );
      }

      const rating = await rateOutfit(validation.data);
      return NextResponse.json({ rating }, { status: 201 });
    }

    // Default: create outfit
    const validation = OutfitCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const outfit = await createOutfit(user.id, validation.data);
    return NextResponse.json({ outfit }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
