import OpenAI from "openai";
import { APP_CONFIG } from "@/config";
import { AIOutfitRankingSchema } from "@/types";
import type { AIOutfitRanking, OutfitCombination } from "@/types";

/**
 * AI Outfit Ranker.
 *
 * Takes deterministically ranked combinations and re-ranks them
 * using AI for aesthetic and confidence analysis.
 *
 * Rules:
 * - Strict JSON schema output
 * - Temperature <= 0.3
 * - Validates response with Zod
 * - Retries once on invalid JSON
 * - Never invents items
 */

const { ai } = APP_CONFIG;

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey });
}

function buildPrompt(combinations: OutfitCombination[]): string {
  const outfitDescriptions = combinations
    .map((combo, index) => {
      const items = combo.items
        .map(
          (item) =>
            `${item.category}: ${item.dominantColor} (formality: ${item.formalityScore}/10, worn ${item.timesWorn} times, ${item.daysSinceWorn} days ago)`
        )
        .join("\n    ");

      return `  Outfit ${index}:
    ${items}
    Deterministic Score: ${combo.totalScore.toFixed(3)}
    Color Harmony: ${combo.colorHarmonyScore.toFixed(3)}
    Formality Coherence: ${combo.formalityCoherence.toFixed(3)}`;
    })
    .join("\n\n");

  return `You are a fashion styling AI. Analyze these ${combinations.length} outfit combinations and re-rank them based on aesthetic appeal and confidence prediction.

OUTFITS:
${outfitDescriptions}

RULES:
- You MUST NOT invent new items. Only reference the provided outfits.
- Select the best outfit by its index (0-${combinations.length - 1}).
- Score aesthetic appeal from 0-10.
- Predict confidence from 0-1 (how confident the wearer would feel).
- Provide brief reasoning.
- Rank all outfits.

Respond with ONLY valid JSON matching this schema:
{
  "selectedOutfitIndex": number (0-${combinations.length - 1}),
  "aestheticScore": number (0-10),
  "confidencePrediction": number (0-1),
  "reasoning": string,
  "rankings": [{ "index": number, "score": number (0-10), "reasoning": string }]
}`;
}

async function callAI(prompt: string): Promise<AIOutfitRanking> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: ai.model,
    temperature: ai.temperature,
    max_tokens: ai.maxTokens,
    messages: [
      {
        role: "system",
        content:
          "You are a fashion styling assistant. Respond only with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response");
  }

  const parsed = JSON.parse(content);
  return AIOutfitRankingSchema.parse(parsed);
}

export async function rankOutfitsWithAI(
  combinations: OutfitCombination[]
): Promise<AIOutfitRanking> {
  const prompt = buildPrompt(combinations);

  // First attempt
  try {
    return await callAI(prompt);
  } catch {
    // Retry once on failure
    try {
      return await callAI(prompt);
    } catch (retryError) {
      throw new Error(
        `AI ranking failed after ${ai.maxRetries + 1} attempts: ${
          retryError instanceof Error ? retryError.message : "Unknown error"
        }`
      );
    }
  }
}
