const ShoppingItem = require('../models/ShoppingItem');
const Cloth = require('../models/Cloth');
const { successResponse, errorResponse } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const openaiService = require('../services/openaiService');

async function analyzeGaps(req, res) {
  try {
    if (!req.user.openaiApiKey) {
      return errorResponse(res, 'OpenAI API key required for gap analysis', 400);
    }

    const wardrobe = await Cloth.find({ userId: req.user._id, isActive: true });
    const decryptedKey = decrypt(req.user.openaiApiKey);
    const suggestions = await openaiService.analyzeShopping(decryptedKey, wardrobe, req.user.profile);

    return successResponse(res, { suggestions }, 'Gap analysis complete');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getWishlist(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };
    const validStatuses = ['wishlist', 'purchased', 'rejected'];
    const statusIdx = validStatuses.indexOf(status);
    if (status && statusIdx >= 0) query.status = validStatuses[statusIdx];

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ShoppingItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ShoppingItem.countDocuments(query),
    ]);
    return successResponse(res, { items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Wishlist fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function addToWishlist(req, res) {
  try {
    const { name, category, reason, link, estimatedPrice, priority, pairsWithItems } = req.body;
    if (!name) return errorResponse(res, 'Name is required', 400);

    const item = await ShoppingItem.create({
      userId: req.user._id,
      name,
      category,
      reason,
      link,
      estimatedPrice,
      priority,
      pairsWithItems,
    });
    return successResponse(res, { item }, 'Added to wishlist', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function updateWishlistItem(req, res) {
  try {
    const body = req.body;
    const validStatuses = ['wishlist', 'purchased', 'rejected'];
    const validCategories = ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear', 'other'];
    const validPriorities = ['low', 'medium', 'high'];

    const updates = {};
    if (body.name !== undefined) updates.name = String(body.name).slice(0, 200);
    if (body.reason !== undefined) updates.reason = String(body.reason).slice(0, 500);
    if (body.link !== undefined) updates.link = String(body.link).slice(0, 500);
    if (body.estimatedPrice !== undefined) updates.estimatedPrice = Number(body.estimatedPrice) || 0;
    if (body.pairsWithItems !== undefined) updates.pairsWithItems = Array.isArray(body.pairsWithItems) ? body.pairsWithItems.map(String) : [];

    const catIdx = validCategories.indexOf(body.category);
    if (body.category !== undefined && catIdx >= 0) updates.category = validCategories[catIdx];

    const statusIdx = validStatuses.indexOf(body.status);
    if (body.status !== undefined) {
      if (statusIdx < 0) return errorResponse(res, 'Invalid status value', 400);
      updates.status = validStatuses[statusIdx];
    }

    const priIdx = validPriorities.indexOf(body.priority);
    if (body.priority !== undefined && priIdx >= 0) updates.priority = validPriorities[priIdx];

    const item = await ShoppingItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return errorResponse(res, 'Item not found', 404);
    return successResponse(res, { item }, 'Item updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function deleteWishlistItem(req, res) {
  try {
    const item = await ShoppingItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return errorResponse(res, 'Item not found', 404);
    return successResponse(res, {}, 'Item deleted');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { analyzeGaps, getWishlist, addToWishlist, updateWishlistItem, deleteWishlistItem };
