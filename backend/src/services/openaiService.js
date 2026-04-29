const OpenAI = require('openai');

async function getSuggestion(userApiKey, prompt) {
  const client = new OpenAI({ apiKey: userApiKey });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content;
}

async function analyzeOutfit(userApiKey, imageBase64, mode) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `Analyze this outfit image. Mode: ${mode || 'general'}. 
  Return JSON with: { score, colorHarmony, fitFeedback, occasionMatch, improvements, verdict }`;
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
    return { verdict: content };
  }
}

async function analyzeClothImage(userApiKey, imageBase64) {
  const client = new OpenAI({ apiKey: userApiKey });
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
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
    ],
  });
  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
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

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\[[\s\S]*\])/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    return [];
  }
}

async function buildTripPack(userApiKey, destination, days, occasions, wardrobe) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `You are a travel packing expert. Create a packing list for this trip.

Destination: ${destination}
Duration: ${days} days
Occasions: ${occasions.join(', ')}
Available wardrobe: ${JSON.stringify(wardrobe.map(i => ({ id: i._id, name: i.name, category: i.category, color: i.color, occasion: i.occasionTags })))}

Return JSON: { packingList: [{ clothId, clothName, category, reason }], tips: [String], totalItems: Number }`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    return { packingList: [], tips: [], totalItems: 0 };
  }
}

async function buildCapsule(userApiKey, selectedItems, count) {
  const client = new OpenAI({ apiKey: userApiKey });
  const prompt = `You are a capsule wardrobe expert. Create a minimal capsule wardrobe from these items.

Available items: ${JSON.stringify(selectedItems.map(i => ({ id: i._id, name: i.name, category: i.category, color: i.color })))}
Target capsule size: ${count} items

Return JSON: { capsuleItems: [{ clothId, clothName, category, color, reason }], outfitCombinations: Number, tips: String }`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message.content;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/(\{[\s\S]*\})/);
    return jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(content);
  } catch {
    return { capsuleItems: [], outfitCombinations: 0, tips: '' };
  }
}

module.exports = { getSuggestion, analyzeOutfit, analyzeClothImage, analyzeShopping, buildTripPack, buildCapsule };
