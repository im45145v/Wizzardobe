const { getLaundryThreshold } = require('./wearService');

const compatibleColors = {
  black: ['white', 'gray', 'grey', 'blue', 'red', 'pink', 'green', 'beige', 'brown'],
  white: ['black', 'blue', 'gray', 'grey', 'green', 'brown', 'beige'],
  blue: ['white', 'black', 'gray', 'grey', 'brown', 'beige'],
  navy: ['white', 'gray', 'grey', 'brown', 'beige'],
  gray: ['black', 'white', 'blue', 'pink', 'green'],
  grey: ['black', 'white', 'blue', 'pink', 'green'],
  brown: ['white', 'blue', 'green', 'beige'],
  beige: ['white', 'black', 'blue', 'brown', 'green'],
  green: ['white', 'black', 'brown', 'beige'],
  red: ['black', 'white', 'gray', 'grey'],
  pink: ['black', 'white', 'gray', 'grey'],
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function colorScore(items) {
  const colors = items.map((i) => normalize(i.color)).filter(Boolean);
  if (colors.length < 2) return 8;
  let score = 6;
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      if (colors[i] === colors[j]) score += 1;
      if (compatibleColors[colors[i]]?.includes(colors[j])) score += 2;
    }
  }
  return Math.min(score, 12);
}

function itemScore(item, context, userSettings) {
  let score = 0;
  const occasion = normalize(context.occasion);
  const season = normalize(context.season);

  if (occasion && item.occasionTags?.map(normalize).includes(occasion)) score += 8;
  if (season && item.season?.map(normalize).includes(season)) score += 4;
  if (!item.lastWornDate) score += 3;

  const threshold = getLaundryThreshold(item, userSettings);
  const laundryPressure = threshold - (item.wearsSinceWash || 0);
  score += Math.max(0, Math.min(4, laundryPressure));

  if (item.condition === 'retire') score -= 8;
  return score;
}

function buildCandidate(itemsByCategory, context, userSettings) {
  const required = ['top', 'bottom', 'shoes'];
  const selected = [];

  for (const category of required) {
    const pool = itemsByCategory[category] || [];
    if (pool.length) selected.push(pool[0]);
  }

  for (const category of ['outerwear', 'accessory']) {
    const pool = itemsByCategory[category] || [];
    if (pool.length && (context.includeOptional || selected.length < 4)) selected.push(pool[0]);
  }

  const score = selected.reduce((sum, item) => sum + itemScore(item, context, userSettings), 0) + colorScore(selected);
  return { items: selected, score };
}

function generateRuleSuggestion(clothes, context = {}, userSettings = {}, pastRatings = []) {
  const groupIdSet = context.groupIds?.length ? new Set(context.groupIds.map(String)) : null;
  const cooldownDate = context.cooldownDays
    ? new Date(Date.now() - context.cooldownDays * 24 * 60 * 60 * 1000)
    : null;

  let eligible = clothes.filter((item) => {
    if (!item.isActive || item.disabled) return false;
    if (context.cleanOnly !== false && item.status !== 'clean') return false;
    if ((item.wearsSinceWash || 0) >= getLaundryThreshold(item, userSettings)) return false;
    if (groupIdSet && !item.groupIds?.some((id) => groupIdSet.has(String(id)))) return false;
    if (cooldownDate && item.lastWornDate && item.lastWornDate > cooldownDate) return false;
    return true;
  });

  if (!eligible.length && cooldownDate) {
    eligible = clothes.filter((item) => item.isActive && !item.disabled && item.status === 'clean');
  }

  const likedIds = new Set();
  pastRatings.forEach((suggestion) => {
    suggestion.outfitItems?.forEach((item) => {
      if (item.clothId) likedIds.add(String(item.clothId));
    });
  });

  const byCategory = eligible.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  Object.keys(byCategory).forEach((category) => {
    byCategory[category].sort((a, b) => {
      const likedDelta = (likedIds.has(String(b._id)) ? 3 : 0) - (likedIds.has(String(a._id)) ? 3 : 0);
      return likedDelta || itemScore(b, context, userSettings) - itemScore(a, context, userSettings);
    });
  });

  const candidate = buildCandidate(byCategory, context, userSettings);
  const requiredCount = ['top', 'bottom', 'shoes'].filter((category) => byCategory[category]?.length).length;
  if (!candidate.items.length || (requiredCount >= 2 && candidate.items.length < 2)) {
    return null;
  }

  const names = candidate.items.map((item) => item.name).join(', ');
  const reasonBits = [];
  if (context.occasion) reasonBits.push(`fits ${context.occasion}`);
  if (context.season) reasonBits.push(`works for ${context.season}`);
  reasonBits.push('keeps laundry and recent wear in balance');

  return {
    outfitItems: candidate.items.map((item) => ({
      clothId: item._id,
      clothName: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
    })),
    score: candidate.score,
    aiReasoning: `${names} was selected because it ${reasonBits.join(', ')}.`,
  };
}

module.exports = { generateRuleSuggestion };
