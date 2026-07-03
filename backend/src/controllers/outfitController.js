const fs = require('fs');
const path = require('path');
const Cloth = require('../models/Cloth');
const Outfit = require('../models/Outfit');
const Suggestion = require('../models/Suggestion');
const { successResponse, errorResponse, buildOutfitPrompt } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const openaiService = require('../services/openaiService');
const visionService = require('../services/visionService');
const { generateRuleSuggestion } = require('../services/outfitEngine');
const { markClothWorn } = require('../services/wearService');

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

    const {
      mode = 'safe',
      occasion,
      weather,
      targetDate,
      needs,
      season,
      groupIds = [],
      cleanOnly = true,
    } = req.body;

    const cooldownDays = req.user.settings?.cooldownDays || 3;

    const wardrobe = await Cloth.find({
      userId: req.user._id,
      isActive: true,
    });

    if (wardrobe.length === 0) {
      return errorResponse(res, 'Add clothes to your wardrobe before requesting a suggestion', 400);
    }

    const pastRatings = await Suggestion.find({ userId: req.user._id, rating: { $gte: 4 } })
      .sort({ createdAt: -1 })
      .limit(5);

    const context = {
      occasion,
      weather,
      targetDate,
      needs,
      season,
      groupIds: Array.isArray(groupIds) ? groupIds : [groupIds].filter(Boolean),
      cleanOnly,
      cooldownDays,
      includeOptional: mode !== 'safe',
    };

    const ruleSuggestion = generateRuleSuggestion(wardrobe, context, req.user.settings || {}, pastRatings);
    if (!ruleSuggestion) {
      return errorResponse(res, 'No available clothes match your filters, laundry status, and cooldown settings', 400);
    }

    let outfitItems = ruleSuggestion.outfitItems;
    let aiReasoning = ruleSuggestion.aiReasoning;
    let score = ruleSuggestion.score;
    let source = 'rule';

    if (req.user.openaiApiKey) {
      try {
        const decryptedKey = decrypt(req.user.openaiApiKey);
        const prompt = buildOutfitPrompt(
          wardrobe.filter((item) => outfitItems.some((selected) => String(selected.clothId) === String(item._id))),
          req.user.profile,
          targetDate || new Date().toDateString(),
          weather || null,
          [occasion, needs].filter(Boolean),
          mode,
          pastRatings
        );
        const aiResponse = await openaiService.getSuggestion(decryptedKey, prompt);

        let parsed;
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/(\{[\s\S]*\})/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(aiResponse);

        const allowedIds = new Set(outfitItems.map((item) => String(item.clothId)));
        const aiItems = (parsed.items || [])
          .filter((item) => allowedIds.has(String(item.clothId)))
          .map((item) => {
            const cloth = wardrobe.find((c) => String(c._id) === String(item.clothId));
            return {
              clothId: item.clothId,
              clothName: item.clothName || (cloth ? cloth.name : 'Unknown'),
              imageUrl: cloth ? cloth.imageUrl : null,
              category: cloth ? cloth.category : undefined,
            };
          });
        if (aiItems.length) outfitItems = aiItems;
        aiReasoning = parsed.reasoning || aiReasoning;
        source = 'ai';
      } catch (e) {
        console.error('AI suggestion failed:', e.message);
      }
    }

    const suggestion = await Suggestion.create({
      userId: req.user._id,
      outfitItems,
      mode,
      occasion,
      targetDate: targetDate ? new Date(targetDate) : new Date(),
      needs,
      score,
      source,
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

    for (const item of suggestion.outfitItems) {
      if (!item.clothId) continue;
      const cloth = await Cloth.findOne({ _id: item.clothId, userId: req.user._id, isActive: true });
      if (!cloth) continue;
      await markClothWorn(cloth, req.user);
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

    const clothIds = items.map((item) => item.clothId || item).filter(Boolean);
    const ownedCloths = await Cloth.find({ _id: { $in: clothIds }, userId: req.user._id, isActive: true });
    if (ownedCloths.length !== clothIds.length) {
      return errorResponse(res, 'All outfit items must belong to your active wardrobe', 400);
    }

    const outfit = await Outfit.create({
      userId: req.user._id,
      items: ownedCloths.map((cloth) => ({ clothId: cloth._id, clothName: cloth.name })),
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

    // req.file.path is set by multer; validate it stays within the uploads directory
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const filePath = path.resolve(req.file.path);
    if (!filePath.startsWith(uploadsDir)) {
      return errorResponse(res, 'Invalid file path', 400);
    }

    const imageBuffer = fs.readFileSync(filePath);
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

async function visualizeSuggestion(req, res) {
  try {
    const suggestion = await Suggestion.findOne({ _id: req.params.id, userId: req.user._id });
    if (!suggestion) return errorResponse(res, 'Suggestion not found', 404);
    if (!req.user.openaiApiKey) return errorResponse(res, 'OpenAI API key required for outfit visualization', 400);

    const itemNames = suggestion.outfitItems.map((item) => item.clothName).filter(Boolean).join(', ');
    const profile = req.user.profile || {};
    const prompt = [
      'Create a realistic fashion visualization of a person wearing this outfit.',
      `Outfit items: ${itemNames}.`,
      `Style preference: ${profile.stylePreference || 'casual'}.`,
      profile.profileImageUrl ? 'Use the user profile image as identity inspiration if supported by the image model.' : '',
      'Keep the outfit faithful to the listed clothing items. No logos unless listed.',
    ].filter(Boolean).join(' ');

    const decryptedKey = decrypt(req.user.openaiApiKey);
    const image = await openaiService.generateOutfitImage(decryptedKey, prompt);
    return successResponse(res, { image }, 'Outfit visualization generated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = {
  suggest,
  getSuggestions,
  rateSuggestion,
  wearSuggestion,
  saveOutfit,
  getOutfits,
  judgeOutfit,
  visualizeSuggestion,
};
