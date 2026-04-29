const openaiService = require('./openaiService');

async function autoTagCloth(apiKey, imageUrl) {
  // imageUrl could be a file path or URL — for local files convert to base64
  let imageBase64;
  if (imageUrl && imageUrl.startsWith('http')) {
    // Remote URL: pass directly via URL form
    const OpenAI = require('openai');
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this clothing item. Return JSON only: { "category": string, "color": string, "style": string, "fabric": string, "occasion": string, "confidence": number }',
            },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    const content = response.choices[0].message.content;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
      return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
    } catch {
      return { category: 'top', color: 'unknown', style: 'casual', fabric: 'unknown', occasion: 'casual', confidence: 0 };
    }
  } else {
    // Local file — read as base64
    const fs = require('fs');
    const filePath = imageUrl.startsWith('/') ? imageUrl : `${process.cwd()}/${imageUrl}`;
    imageBase64 = fs.readFileSync(filePath).toString('base64');
    return openaiService.analyzeClothImage(apiKey, imageBase64);
  }
}

async function judgeOutfit(apiKey, imageBase64, userProfile, mode) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey });

  const toneMap = {
    roast: 'Be brutally honest and funny, like a fashion roast.',
    hype: 'Be extremely enthusiastic and complimentary.',
    formal: 'Be professional and formal.',
    comfy: 'Be warm, friendly, and encouraging.',
  };
  const tone = toneMap[mode] || 'Be balanced and constructive.';

  const profileContext = userProfile
    ? `User style preference: ${userProfile.stylePreference || 'casual'}, body type: ${userProfile.bodyType || 'not specified'}.`
    : '';

  const prompt = `You are a fashion expert judging an outfit. ${tone} ${profileContext}
  
Analyze this outfit image and return JSON:
{
  "score": number (1-10),
  "colorHarmony": string,
  "fitFeedback": string,
  "occasionMatch": string,
  "improvements": [string],
  "verdict": string,
  "toneUsed": "${mode || 'balanced'}"
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
  });

  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    return {
      score: 5,
      colorHarmony: 'N/A',
      fitFeedback: content,
      occasionMatch: 'N/A',
      improvements: [],
      verdict: content,
      toneUsed: mode || 'balanced',
    };
  }
}

module.exports = { autoTagCloth, judgeOutfit };
