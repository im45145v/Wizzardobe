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
    if (status) query.status = status;

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
    const item = await ShoppingItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
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
