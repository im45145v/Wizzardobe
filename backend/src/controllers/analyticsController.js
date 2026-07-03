const Cloth = require('../models/Cloth');
const Outfit = require('../models/Outfit');
const { successResponse, errorResponse, getDaysAgo } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const openaiService = require('../services/openaiService');

async function getDashboardStats(req, res) {
  try {
    const userId = req.user._id;

    const [total, byStatus, byCategory, topWorn] = await Promise.all([
      Cloth.countDocuments({ userId, isActive: true }),
      Cloth.aggregate([
        { $match: { userId, isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Cloth.aggregate([
        { $match: { userId, isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      Cloth.find({ userId, isActive: true }).sort({ wearCount: -1 }).limit(5),
    ]);

    const statusCounts = byStatus.reduce((acc, row) => {
      acc[row._id || 'unknown'] = row.count;
      return acc;
    }, {});
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const outfitsThisWeek = await Outfit.countDocuments({ userId, wornDate: { $gte: weekStart } });

    return successResponse(res, {
      total,
      totalCloths: total,
      cleanItems: statusCounts.clean || 0,
      dirtyItems: (statusCounts.dirty || 0) + (statusCounts.in_wash || 0),
      byStatus,
      byCategory,
      topWorn,
      outfitsThisWeek,
    }, 'Dashboard stats fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getMostWorn(req, res) {
  try {
    const cloths = await Cloth.find({ userId: req.user._id, isActive: true })
      .sort({ wearCount: -1 })
      .limit(10);
    return successResponse(res, { cloths }, 'Most worn items fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getLeastWorn(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cloths = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      $or: [{ lastWornDate: { $lt: thirtyDaysAgo } }, { lastWornDate: null }],
    }).sort({ lastWornDate: 1 }).limit(20);
    return successResponse(res, { cloths }, 'Least worn items fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getCostPerWear(req, res) {
  try {
    const cloths = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      purchasePrice: { $gt: 0 },
    });

    const data = cloths.map((c) => ({
      cloth: { _id: c._id, name: c.name, category: c.category, imageUrl: c.imageUrl },
      purchasePrice: c.purchasePrice,
      wearCount: c.wearCount,
      costPerWear: c.wearCount > 0 ? +(c.purchasePrice / c.wearCount).toFixed(2) : c.purchasePrice,
    }));

    data.sort((a, b) => a.costPerWear - b.costPerWear);
    return successResponse(res, { data }, 'Cost per wear fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getOutfitVariety(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = await Outfit.countDocuments({
      userId: req.user._id,
      wornDate: { $gte: thirtyDaysAgo },
    });
    return successResponse(res, { uniqueOutfits: count }, 'Outfit variety fetched');
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

module.exports = { getDashboardStats, getMostWorn, getLeastWorn, getCostPerWear, getOutfitVariety, getStylePersona };
