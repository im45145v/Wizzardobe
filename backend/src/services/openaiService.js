const OpenAI = require('openai');

function extractJson(content, fallback) {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/) || content.match(/(\[[\s\S]*\])/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    return fallback;
  }
}

async function textResponse(client, input, options = {}) {
  const model = options.model || process.env.OPENAI_TEXT_MODEL || 'gpt-4o';
  if (client.responses?.create) {
    const response = await client.responses.create({
      model,
      input,
      text: options.text,
    });
    return response.output_text || response.output?.map((part) => part.content?.map((c) => c.text).join('')).join('') || '';
  }

  const response = await client.chat.completions.create({
    model,
    messages: Array.isArray(input) ? input : [{ role: 'user', content: input }],
    response_format: options.jsonObject ? { type: 'json_object' } : undefined,
  });
  return response.choices[0].message.content;
}

async function getSuggestion(userApiKey, prompt) {
  const client = new OpenAI({ apiKey: userApiKey });
  return textResponse(client, prompt, { jsonObject: true });
}

async function analyzeOutfit(userApiKey, imageBase64, mode) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `Analyze this outfit image. Mode: ${mode || 'general'}. 
  Return JSON with: { score, colorHarmony, fitFeedback, occasionMatch, improvements, verdict }`;
  const content = await textResponse(client, [
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
    ], { jsonObject: true });
  return extractJson(content, { verdict: content });
}

async function analyzeClothImage(userApiKey, imageBase64) {
  const client = new OpenAI({ apiKey: userApiKey });
  const content = await textResponse(client, [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this clothing item. Return JSON: { category, color, style, fabric, occasion, confidence }',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ], { jsonObject: true });
  const parsed = extractJson(content, null);
  if (parsed) return parsed;
  {
    return { category: 'top', color: 'unknown', style: 'casual', fabric: 'unknown', occasion: 'casual', confidence: 0 };
  }
}

async function analyzeShopping(userApiKey, wardrobeData, userProfile) {
  const client = new OpenAI({ apiKey: userApiKey });
  const wardrobeSummary = wardrobeData
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

  const prompt = `You are a fashion advisor. Analyze this wardrobe and suggest shopping items to fill gaps.
  
Wardrobe summary by category: ${JSON.stringify(wardrobeSummary)}
Wardrobe items: ${JSON.stringify(wardrobeData.slice(0, 20).map(i => ({ name: i.name, category: i.category, color: i.color, occasionTags: i.occasionTags })))}
User profile: ${JSON.stringify(userProfile)}

Return a JSON array of suggested shopping items:
[{ name, category, reason, estimatedPrice, priority }]

Focus on gaps, versatility, and the user's style preference. Return 3-6 items.`;

  const content = await textResponse(client, prompt, { jsonObject: false });
  return extractJson(content, []);
}

async function buildTripPack(userApiKey, destination, days, occasions, wardrobe) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `You are a travel packing expert. Create a packing list for this trip.

Destination: ${destination}
Duration: ${days} days
Occasions: ${occasions.join(', ')}
Available wardrobe: ${JSON.stringify(wardrobe.map(i => ({ id: i._id, name: i.name, category: i.category, color: i.color, occasion: i.occasionTags })))}

Return JSON: { packingList: [{ clothId, clothName, category, reason }], tips: [String], totalItems: Number }`;

  const content = await textResponse(client, prompt, { jsonObject: true });
  return extractJson(content, { packingList: [], tips: [], totalItems: 0 });
}

async function buildCapsule(userApiKey, selectedItems, count) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `You are a capsule wardrobe expert. Create a minimal capsule wardrobe from these items.

Available items: ${JSON.stringify(selectedItems.map(i => ({ id: i._id, name: i.name, category: i.category, color: i.color })))}
Target capsule size: ${count} items

Return JSON: { capsuleItems: [{ clothId, clothName, category, color, reason }], outfitCombinations: Number, tips: String }`;

  const content = await textResponse(client, prompt, { jsonObject: true });
  return extractJson(content, { capsuleItems: [], outfitCombinations: 0, tips: '' });
}

async function generateOutfitImage(userApiKey, prompt) {
  const client = new OpenAI({ apiKey: userApiKey });
  if (!client.images?.generate) {
    throw new Error('Image generation is not supported by the installed OpenAI SDK');
  }
  const response = await client.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    prompt,
    size: process.env.OPENAI_IMAGE_SIZE || '1024x1024',
  });
  const image = response.data?.[0];
  return image?.b64_json ? { b64_json: image.b64_json } : { url: image?.url };
}

module.exports = {
  getSuggestion,
  analyzeOutfit,
  analyzeClothImage,
  analyzeShopping,
  buildTripPack,
  buildCapsule,
  generateOutfitImage,
};
