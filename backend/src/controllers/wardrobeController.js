const path = require('path');
const Cloth = require('../models/Cloth');
const LaundryLog = require('../models/LaundryLog');
const { successResponse, errorResponse } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const visionService = require('../services/visionService');

async function addCloth(req, res) {
  try {
    const {
      name, category, color, fabric, brand,
      occasionTags, season, condition, purchasePrice, purchaseDate,
    } = req.body;

    if (!name) return errorResponse(res, 'Name is required', 400);
    if (!category) return errorResponse(res, 'Category is required', 400);

    const validCategories = ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear'];
    if (!validCategories.includes(category)) return errorResponse(res, 'Invalid category', 400);

    let imageUrl = null;
    let autoTagData = null;

    if (req.file) {
      imageUrl = `/uploads/${req.user.id}/${req.file.filename}`;

      if (req.user.openaiApiKey) {
        try {
          const decryptedKey = decrypt(req.user.openaiApiKey);
          autoTagData = await visionService.autoTagCloth(decryptedKey, path.join(process.cwd(), imageUrl));
        } catch (e) {
          console.error('AutoTag failed:', e.message);
        }
      }
    }

    const parseArrayField = (field) => {
      if (!field) return undefined;
      if (Array.isArray(field)) return field;
      try { return JSON.parse(field); } catch { return [field]; }
    };

    const cloth = await Cloth.create({
      userId: req.user._id,
      name,
      category,
      color,
      fabric,
      brand,
      occasionTags: parseArrayField(occasionTags),
      season: parseArrayField(season),
      condition,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      purchaseDate,
      imageUrl,
      autoTagData,
    });

    return successResponse(res, { cloth }, 'Cloth added', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getCloths(req, res) {
  try {
    const { category, color, status, search, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id, isActive: true };

    const validCategories = ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear'];
    const validStatuses = ['clean', 'dirty', 'in_wash'];
    const catIdx = validCategories.indexOf(category);
    const statusIdx = validStatuses.indexOf(status);

    if (category && catIdx >= 0) query.category = validCategories[catIdx];
    if (color) query.color = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (status && statusIdx >= 0) query.status = validStatuses[statusIdx];
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: new RegExp(escaped, 'i') },
        { brand: new RegExp(escaped, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [cloths, total] = await Promise.all([
      Cloth.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Cloth.countDocuments(query),
    ]);

    return successResponse(res, {
      cloths,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    }, 'Cloths fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getCloth(req, res) {
  try {
    const cloth = await Cloth.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);
    return successResponse(res, { cloth }, 'Cloth fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function updateCloth(req, res) {
  try {
    const cloth = await Cloth.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);

    const allowedFields = ['name', 'category', 'color', 'fabric', 'brand', 'occasionTags', 'season', 'condition', 'purchasePrice', 'purchaseDate'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) cloth[field] = req.body[field];
    });

    await cloth.save();
    return successResponse(res, { cloth }, 'Cloth updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function deleteCloth(req, res) {
  try {
    const cloth = await Cloth.findOne({ _id: req.params.id, userId: req.user._id });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);

    cloth.isActive = false;
    await cloth.save();
    return successResponse(res, {}, 'Cloth deleted');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function markWorn(req, res) {
  try {
    const cloth = await Cloth.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);

    cloth.lastWornDate = new Date();
    cloth.wearCount += 1;

    const settings = req.user.settings || {};
    const wearBeforeDirty = settings.wearBeforeDirty || { top: 3, bottom: 3, innerwear: 1, shoes: 5, outerwear: 7 };
    const threshold = wearBeforeDirty[cloth.category] || 3;

    if (cloth.wearCount % threshold === 0) {
      cloth.status = 'dirty';
      await LaundryLog.create({
        userId: req.user._id,
        clothId: cloth._id,
        status: 'dirty',
        markedAt: new Date(),
      });
    }

    await cloth.save();
    return successResponse(res, { cloth }, 'Marked as worn');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function markStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['clean', 'dirty', 'in_wash'];
    if (!validStatuses.includes(status)) return errorResponse(res, 'Invalid status', 400);

    const cloth = await Cloth.findOne({ _id: req.params.id, userId: req.user._id, isActive: true });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);

    const prevStatus = cloth.status;
    cloth.status = status;

    if (status === 'clean' && prevStatus !== 'clean') {
      cloth.daysOutsideClean = 0;
      await LaundryLog.findOneAndUpdate(
        { clothId: cloth._id, status: { $in: ['dirty', 'in_wash'] }, resolvedAt: null },
        { status: 'clean', resolvedAt: new Date() },
        { sort: { createdAt: -1 } }
      );
    } else if (status !== 'clean') {
      await LaundryLog.create({
        userId: req.user._id,
        clothId: cloth._id,
        status,
        markedAt: new Date(),
      });
    }

    await cloth.save();
    return successResponse(res, { cloth }, 'Status updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { addCloth, getCloths, getCloth, updateCloth, deleteCloth, markWorn, markStatus };
