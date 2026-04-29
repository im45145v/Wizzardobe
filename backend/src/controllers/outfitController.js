const fs = require('fs');
const Cloth = require('../models/Cloth');
const Outfit = require('../models/Outfit');
const Suggestion = require('../models/Suggestion');
const LaundryLog = require('../models/LaundryLog');
const { successResponse, errorResponse, buildOutfitPrompt, getDaysAgo } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const openaiService = require('../services/openaiService');
const visionService = require('../services/visionService');

// In-memory rate limiting: { userId: [timestamps] }
const aiRequestLog = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const key = String(userId);
  const requests = (aiRequestLog.get(key) || []).filter((t) => t > hourAgo);
  if (requests.length >= 20) return false;
  requests.push(now);
  aiRequestLog.set(key, requests);
  return true;
}

async function suggest(req, res) {
  try {
    if (!checkRateLimit(req.user._id)) {
      return errorResponse(res, 'Rate limit exceeded: 20 AI suggestions per hour', 429);
    }

    const { mode = 'safe', occasion, weather } = req.body;

    const cooldownDays = req.user.settings?.cooldownDays || 3;
    const cooldownDate = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000);

    const cleanClothes = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      status: 'clean',
      $or: [{ lastWornDate: { $lt: cooldownDate } }, { lastWornDate: null }],
    });

    if (cleanClothes.length === 0) {
      return errorResponse(res, 'No clean clothes available for suggestion', 400);
    }

    const pastRatings = await Suggestion.find({ userId: req.user._id, rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(5);

    let outfitItems = [];
    let aiReasoning = 'AI suggestion not available';

    if (req.user.openaiApiKey) {
      try {
        const decryptedKey = decrypt(req.user.openaiApiKey);
        const prompt = buildOutfitPrompt(
          cleanClothes,
          req.user.profile,
          new Date().toDateString(),
          weather || null,
          occasion ? [occasion] : [],
          mode,
          pastRatings
        );
        const aiResponse = await openaiService.getSuggestion(decryptedKey, prompt);

        let parsed;
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/(\{[\s\S]*\})/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(aiResponse);

        outfitItems = (parsed.items || []).map((item) => {
          const cloth = cleanClothes.find((c) => String(c._id) === String(item.clothId));
          return {
            clothId: item.clothId,
            clothName: item.clothName || (cloth ? cloth.name : 'Unknown'),
            imageUrl: cloth ? cloth.imageUrl : null,
          };
        });
        aiReasoning = parsed.reasoning || '';
      } catch (e) {
        console.error('AI suggestion failed:', e.message);
        // Fallback: pick random items
        const tops = cleanClothes.filter((c) => c.category === 'top');
        const bottoms = cleanClothes.filter((c) => c.category === 'bottom');
        const shoes = cleanClothes.filter((c) => c.category === 'shoes');
        if (tops[0]) outfitItems.push({ clothId: tops[0]._id, clothName: tops[0].name, imageUrl: tops[0].imageUrl });
        if (bottoms[0]) outfitItems.push({ clothId: bottoms[0]._id, clothName: bottoms[0].name, imageUrl: bottoms[0].imageUrl });
        if (shoes[0]) outfitItems.push({ clothId: shoes[0]._id, clothName: shoes[0].name, imageUrl: shoes[0].imageUrl });
        aiReasoning = 'Fallback suggestion (AI unavailable)';
      }
    } else {
      const tops = cleanClothes.filter((c) => c.category === 'top');
      const bottoms = cleanClothes.filter((c) => c.category === 'bottom');
      const shoes = cleanClothes.filter((c) => c.category === 'shoes');
      if (tops[0]) outfitItems.push({ clothId: tops[0]._id, clothName: tops[0].name, imageUrl: tops[0].imageUrl });
      if (bottoms[0]) outfitItems.push({ clothId: bottoms[0]._id, clothName: bottoms[0].name, imageUrl: bottoms[0].imageUrl });
      if (shoes[0]) outfitItems.push({ clothId: shoes[0]._id, clothName: shoes[0].name, imageUrl: shoes[0].imageUrl });
      aiReasoning = 'Basic suggestion (no AI key configured)';
    }

    const suggestion = await Suggestion.create({
      userId: req.user._id,
      outfitItems,
      mode,
      weatherData: weather || null,
      calendarEvents: occasion ? [occasion] : [],
      aiReasoning,
      date: new Date(),
    });

    return successResponse(res, { suggestion }, 'Outfit suggested', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getSuggestions(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [suggestions, total] = await Promise.all([
      Suggestion.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Suggestion.countDocuments({ userId: req.user._id }),
    ]);
    return successResponse(res, { suggestions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Suggestions fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function rateSuggestion(req, res) {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) return errorResponse(res, 'Rating must be 1-5', 400);

    const suggestion = await Suggestion.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { rating: Number(rating) },
      { new: true }
    );
    if (!suggestion) return errorResponse(res, 'Suggestion not found', 404);
    return successResponse(res, { suggestion }, 'Suggestion rated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function wearSuggestion(req, res) {
  try {
    const suggestion = await Suggestion.findOne({ _id: req.params.id, userId: req.user._id });
    if (!suggestion) return errorResponse(res, 'Suggestion not found', 404);

    suggestion.wasWorn = true;
    await suggestion.save();

    const settings = req.user.settings || {};
    const wearBeforeDirty = settings.wearBeforeDirty || { top: 3, bottom: 3, innerwear: 1, shoes: 5, outerwear: 7 };

    for (const item of suggestion.outfitItems) {
      if (!item.clothId) continue;
      const cloth = await Cloth.findOne({ _id: item.clothId, userId: req.user._id, isActive: true });
      if (!cloth) continue;

      cloth.lastWornDate = new Date();
      cloth.wearCount += 1;

      const threshold = wearBeforeDirty[cloth.category] || 3;
      if (cloth.wearCount % threshold === 0) {
        cloth.status = 'dirty';
        await LaundryLog.create({ userId: req.user._id, clothId: cloth._id, status: 'dirty', markedAt: new Date() });
      }
      await cloth.save();
    }

    return successResponse(res, { suggestion }, 'Marked as worn');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function saveOutfit(req, res) {
  try {
    const { items, name, occasion, season, rating, wornDate, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 'Items array is required', 400);
    }

    const outfit = await Outfit.create({
      userId: req.user._id,
      items,
      name,
      occasion,
      season,
      rating,
      wornDate,
      notes,
      isAISuggested: false,
    });
    return successResponse(res, { outfit }, 'Outfit saved', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getOutfits(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [outfits, total] = await Promise.all([
      Outfit.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Outfit.countDocuments({ userId: req.user._id }),
    ]);
    return successResponse(res, { outfits, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Outfits fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function judgeOutfit(req, res) {
  try {
    if (!req.file) return errorResponse(res, 'Image is required', 400);

    const { mode = 'balanced' } = req.body;

    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    if (!req.user.openaiApiKey) {
      return errorResponse(res, 'OpenAI API key required for outfit judging', 400);
    }

    const decryptedKey = decrypt(req.user.openaiApiKey);
    const judgment = await visionService.judgeOutfit(decryptedKey, imageBase64, req.user.profile, mode);

    return successResponse(res, { judgment }, 'Outfit judged');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { suggest, getSuggestions, rateSuggestion, wearSuggestion, saveOutfit, getOutfits, judgeOutfit };
