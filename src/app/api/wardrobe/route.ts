import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getItemsByUser,
  createItem,
} from "@/services/wardrobe.service";
import { WardrobeItemCreateSchema } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const filters = {
      category: searchParams.get("category") ?? undefined,
      locationTag: searchParams.get("locationTag") ?? undefined,
      isActive: searchParams.has("isActive")
        ? searchParams.get("isActive") === "true"
        : undefined,
      season: searchParams.get("season") ?? undefined,
    };

    const items = await getItemsByUser(user.id, filters);
    return NextResponse.json({ items });
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

    const validation = WardrobeItemCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const item = await createItem(user.id, validation.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
