import { prisma } from "@/db/client";
import type { CalendarEventCreate } from "@/types";

/**
 * Calendar service: manages calendar events and Google Calendar integration scaffold.
 */

export async function getEventsForDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.calendarEvent.findMany({
    where: {
      userId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createEvent(
  userId: string,
  data: CalendarEventCreate
) {
  return prisma.calendarEvent.create({
    data: {
      ...data,
      userId,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
    },
  });
}

export async function classifyEventFormality(
  title: string,
  description?: string
): Promise<number> {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  // Deterministic classification before AI
  const formalKeywords = [
    "meeting",
    "interview",
    "conference",
    "presentation",
    "gala",
    "formal",
    "business",
    "corporate",
    "wedding",
    "ceremony",
  ];
  const casualKeywords = [
    "hangout",
    "casual",
    "party",
    "gym",
    "workout",
    "brunch",
    "lunch",
    "coffee",
    "walk",
    "shopping",
  ];
  const semiKeywords = [
    "dinner",
    "date",
    "event",
    "reception",
    "seminar",
    "class",
    "lecture",
  ];

  const formalScore = formalKeywords.filter((k) => text.includes(k)).length;
  const casualScore = casualKeywords.filter((k) => text.includes(k)).length;
  const semiScore = semiKeywords.filter((k) => text.includes(k)).length;

  if (formalScore > casualScore && formalScore > semiScore) return 8;
  if (casualScore > formalScore && casualScore > semiScore) return 3;
  if (semiScore > 0) return 6;

  return 5; // Default middle formality
}

/**
 * Google Calendar integration scaffold.
 * Placeholder for OAuth flow and event syncing.
 */
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

export function getGoogleAuthUrl(_config: GoogleCalendarConfig): string {
  // Scaffold: return Google OAuth URL
  const params = new URLSearchParams({
    client_id: _config.clientId,
    redirect_uri: _config.redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function syncGoogleCalendarEvents(
  ..._args: [userId: string, config: GoogleCalendarConfig]
): Promise<{ synced: number }> {
  // Scaffold: implement Google Calendar API sync
  // This would fetch events from Google Calendar and store them
  void _args;
  return { synced: 0 };
}
