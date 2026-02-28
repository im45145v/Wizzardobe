import OpenAI from "openai";
import { APP_CONFIG } from "@/config";
import { AIStyleProfileSchema } from "@/types";
import type { AIStyleProfile } from "@/types";

/**
 * AI Style Profile Generator.
 *
 * Analyzes wardrobe composition to generate a user's style profile.
 * Used for personalized recommendations and analytics.
 */

const { ai } = APP_CONFIG;

interface WardrobeSnapshot {
  categories: Record<string, number>;
  topColors: string[];
  avgFormality: number;
  totalItems: number;
  topTags: string[];
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

function buildProfilePrompt(snapshot: WardrobeSnapshot): string {
  return `Analyze this wardrobe composition and generate a style profile.

WARDROBE DATA:
- Total items: ${snapshot.totalItems}
- Categories: ${JSON.stringify(snapshot.categories)}
- Top colors: ${snapshot.topColors.join(", ")}
- Average formality: ${snapshot.avgFormality.toFixed(1)}/10
- Common tags: ${snapshot.topTags.join(", ")}

Respond with ONLY valid JSON matching this schema:
{
  "dominantStyle": string (e.g., "Smart Casual", "Minimalist", "Business Professional"),
  "colorPreferences": string[] (top 3 color families),
  "formalityTendency": number (1-10),
  "suggestions": string[] (up to 5 wardrobe improvement suggestions)
}`;
}

export async function generateStyleProfile(
  snapshot: WardrobeSnapshot
): Promise<AIStyleProfile> {
  const client = getOpenAIClient();
  const prompt = buildProfilePrompt(snapshot);

  const response = await client.chat.completions.create({
    model: ai.model,
    temperature: ai.temperature,
    max_tokens: ai.maxTokens,
    messages: [
      {
        role: "system",
        content:
          "You are a fashion analysis assistant. Respond only with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response for style profile");
  }

  const parsed = JSON.parse(content);
  return AIStyleProfileSchema.parse(parsed);
}
