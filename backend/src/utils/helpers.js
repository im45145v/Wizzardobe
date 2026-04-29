function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function errorResponse(res, message = 'Error', statusCode = 400, errors = null) {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
}

function getDaysAgo(date) {
  if (!date) return null;
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calculateDirtyStatus(wearCount, category, wearBeforeDirty) {
  const threshold = wearBeforeDirty[category] || 3;
  return wearCount > 0 && wearCount % threshold === 0;
}

function buildOutfitPrompt(cleanClothes, userProfile, date, weatherData, calendarEvents, mode, pastRatings) {
  const categorized = cleanClothes.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push({ id: c._id, name: c.name, color: c.color, occasionTags: c.occasionTags });
    return acc;
  }, {});

  const weatherContext = weatherData
    ? `Weather: ${weatherData.description || 'unknown'}, temp ${weatherData.temp || 'unknown'}°C`
    : 'No weather data available';

  const calendarContext =
    calendarEvents && calendarEvents.length > 0
      ? `Today's events: ${calendarEvents.join(', ')}`
      : 'No calendar events';

  const profileContext = userProfile
    ? `Style: ${userProfile.stylePreference || 'casual'}, occasions: ${(userProfile.occasions || []).join(', ')}`
    : 'No profile data';

  const modeInstructions = {
    safe: 'Suggest a reliable, tried-and-true outfit.',
    surprise: 'Be creative and suggest an unexpected combination.',
    formal: 'Suggest a professional and formal outfit.',
    comfy: 'Suggest the most comfortable and casual outfit.',
  };

  const highRated = pastRatings && pastRatings.length > 0
    ? `Past highly-rated outfit items: ${pastRatings.slice(0, 3).map(s => s.outfitItems.map(i => i.clothName).join(', ')).join(' | ')}`
    : '';

  return `You are a personal AI stylist. Suggest a complete outfit for today.

Date: ${date || new Date().toDateString()}
${weatherContext}
${calendarContext}
User profile: ${profileContext}
Mode: ${modeInstructions[mode] || modeInstructions.safe}
${highRated}

Available clean clothes:
${JSON.stringify(categorized, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "items": [
    { "clothId": "id_string", "clothName": "name" }
  ],
  "reasoning": "explanation of why this outfit works"
}

Select one item from relevant categories (top, bottom, shoes minimum). Use actual IDs from the list.`;
}

module.exports = { successResponse, errorResponse, getDaysAgo, calculateDirtyStatus, buildOutfitPrompt };
