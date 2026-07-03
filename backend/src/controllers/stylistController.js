const Cloth = require('../models/Cloth');
const { successResponse, errorResponse } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const openaiService = require('../services/openaiService');

async function packTrip(req, res) {
  try {
    const { destination, days, occasions } = req.body;
    if (!destination) return errorResponse(res, 'Destination is required', 400);
    if (!days || days < 1) return errorResponse(res, 'Days must be a positive number', 400);
    if (!Array.isArray(occasions) || occasions.length === 0) {
      return errorResponse(res, 'Occasions array is required', 400);
    }

    if (!req.user.openaiApiKey) {
      return errorResponse(res, 'OpenAI API key required for trip packing', 400);
    }

    const wardrobe = await Cloth.find({ userId: req.user._id, isActive: true, status: 'clean' });
    const decryptedKey = decrypt(req.user.openaiApiKey);
    const result = await openaiService.buildTripPack(decryptedKey, destination, days, occasions, wardrobe);

    return successResponse(res, { packingList: result }, 'Trip packing list created');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function buildCapsule(req, res) {
  try {
    const { count = 10, stylePreference } = req.body;

    if (!req.user.openaiApiKey) {
      return errorResponse(res, 'OpenAI API key required for capsule wardrobe', 400);
    }

    const wardrobe = await Cloth.find({ userId: req.user._id, isActive: true });
    const decryptedKey = decrypt(req.user.openaiApiKey);
    const result = await openaiService.buildCapsule(decryptedKey, wardrobe, Number(count));

    return successResponse(res, { capsule: result }, 'Capsule wardrobe created');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getStylePersona(req, res) {
  try {
    if (!req.user.openaiApiKey) {
      return errorResponse(res, 'OpenAI API key required for style persona', 400);
    }

    const wardrobe = await Cloth.find({ userId: req.user._id, isActive: true });
    const summary = wardrobe.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {});

    const colors = [...new Set(wardrobe.map((c) => c.color).filter(Boolean))];
    const decryptedKey = decrypt(req.user.openaiApiKey);

    const prompt = `Based on this wardrobe data, describe this person's style persona in 2-3 sentences.
    
Wardrobe summary: ${JSON.stringify(summary)}
Common colors: ${colors.slice(0, 10).join(', ')}
User profile: ${JSON.stringify(req.user.profile)}

Be creative, specific, and positive. Focus on their unique style identity.`;

    const persona = await openaiService.getSuggestion(decryptedKey, prompt);
    return successResponse(res, { persona }, 'Style persona fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getSeasonalRefresh(req, res) {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const items = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      $or: [
        { condition: { $in: ['worn', 'retire'] } },
        { lastWornDate: { $lt: ninetyDaysAgo } },
        { lastWornDate: null, createdAt: { $lt: ninetyDaysAgo } },
      ],
    });

    let recommendations = items.map((item) => ({
      item: item.toObject(),
      recommendation: item.condition === 'retire' ? 'donate' : item.condition === 'worn' ? 'refresh' : 'evaluate',
    }));

    if (req.user.openaiApiKey && items.length > 0) {
      try {
        const decryptedKey = decrypt(req.user.openaiApiKey);
        const prompt = `You are a wardrobe consultant. Analyze these clothing items and recommend action: keep, donate, or refresh.

Items: ${JSON.stringify(items.map(i => ({ name: i.name, category: i.category, condition: i.condition, wearCount: i.wearCount, lastWorn: i.lastWornDate })))}

Return JSON array: [{ itemIndex: number, name: string, action: "keep"|"donate"|"refresh", reason: string }]`;

        const aiResponse = await openaiService.getSuggestion(decryptedKey, prompt);
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/(\[[\s\S]*\])/);
        if (jsonMatch) {
          const aiRecs = JSON.parse(jsonMatch[1]);
          recommendations = recommendations.map((r, idx) => {
            const aiRec = aiRecs.find((a) => a.itemIndex === idx);
            return aiRec ? { ...r, recommendation: aiRec.action, reason: aiRec.reason } : r;
          });
        }
      } catch (e) {
        console.error('AI seasonal refresh failed:', e.message);
      }
    }

    return successResponse(res, { recommendations, count: recommendations.length }, 'Seasonal refresh analysis complete');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { packTrip, buildCapsule, getStylePersona, getSeasonalRefresh };
