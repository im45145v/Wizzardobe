import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/services/analytics.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const analytics = await getAnalyticsSummary(user.id);
    return NextResponse.json({ analytics });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
