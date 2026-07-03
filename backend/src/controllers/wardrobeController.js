const Cloth = require('../models/Cloth');
const WardrobeGroup = require('../models/WardrobeGroup');
const { successResponse, errorResponse } = require('../utils/helpers');
const { decrypt } = require('../services/encryptionService');
const visionService = require('../services/visionService');
const { markClothWorn, updateClothLaundryStatus } = require('../services/wearService');

const validCategories = ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear'];

function parseArrayField(field) {
  if (field === undefined || field === null || field === '') return undefined;
  if (Array.isArray(field)) return field;
  try {
    const parsed = JSON.parse(field);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return String(field)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

async function addCloth(req, res) {
  try {
    const {
      name, category, color, fabric, brand,
      occasionTags, season, tags, groupIds, condition, purchasePrice, purchaseDate,
      maxWearsBeforeLaundry, disabled, disabledReason,
    } = req.body;

    if (!name) return errorResponse(res, 'Name is required', 400);
    if (!category) return errorResponse(res, 'Category is required', 400);

    if (!validCategories.includes(category)) return errorResponse(res, 'Invalid category', 400);

    let imageUrl = null;
    let autoTagData = null;

    if (req.file) {
      imageUrl = `/uploads/${req.user.id}/${req.file.filename}`;

      if (req.user.openaiApiKey) {
        try {
          const decryptedKey = decrypt(req.user.openaiApiKey);
          autoTagData = await visionService.autoTagCloth(decryptedKey, req.file.path);
        } catch (e) {
          console.error('AutoTag failed:', e.message);
        }
      }
    }

    const cloth = await Cloth.create({
      userId: req.user._id,
      name,
      category,
      color,
      fabric,
      brand,
      occasionTags: parseArrayField(occasionTags),
      season: parseArrayField(season),
      tags: parseArrayField(tags),
      groupIds: parseArrayField(groupIds),
      condition,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      purchaseDate,
      maxWearsBeforeLaundry: maxWearsBeforeLaundry ? Number(maxWearsBeforeLaundry) : undefined,
      disabled: disabled === true || disabled === 'true',
      disabledReason,
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
    const { category, color, status, search, tag, groupId, includeDisabled, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id, isActive: true };

    const validStatuses = ['clean', 'dirty', 'in_wash'];
    const catIdx = validCategories.indexOf(category);
    const statusIdx = validStatuses.indexOf(status);

    if (category && catIdx >= 0) query.category = validCategories[catIdx];
    if (color) query.color = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (status && statusIdx >= 0) query.status = validStatuses[statusIdx];
    if (tag) query.tags = tag;
    if (groupId) query.groupIds = groupId;
    if (includeDisabled !== 'true') query.disabled = { $ne: true };
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

    const allowedFields = [
      'name', 'category', 'color', 'fabric', 'brand', 'occasionTags', 'season', 'tags', 'groupIds',
      'condition', 'purchasePrice', 'purchaseDate', 'maxWearsBeforeLaundry', 'disabled', 'disabledReason',
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (['occasionTags', 'season', 'tags', 'groupIds'].includes(field)) {
          cloth[field] = parseArrayField(req.body[field]) || [];
        } else if (field === 'maxWearsBeforeLaundry' || field === 'purchasePrice') {
          cloth[field] = req.body[field] === '' ? undefined : Number(req.body[field]);
        } else {
          cloth[field] = req.body[field];
        }
      }
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

    await markClothWorn(cloth, req.user);
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

    await updateClothLaundryStatus(cloth, req.user, status);
    return successResponse(res, { cloth }, 'Status updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getGroups(req, res) {
  try {
    const groups = await WardrobeGroup.find({ userId: req.user._id }).sort({ type: 1, name: 1 });
    return successResponse(res, { groups }, 'Groups fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function createGroup(req, res) {
  try {
    const { name, type = 'custom', color, notes } = req.body;
    if (!name) return errorResponse(res, 'Group name is required', 400);
    const group = await WardrobeGroup.create({ userId: req.user._id, name, type, color, notes });
    return successResponse(res, { group }, 'Group created', 201);
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 'A group with that name already exists', 409);
    return errorResponse(res, err.message, 500);
  }
}

async function updateGroup(req, res) {
  try {
    const updates = {};
    ['name', 'type', 'color', 'notes'].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const group = await WardrobeGroup.findOneAndUpdate(
      { _id: req.params.groupId, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!group) return errorResponse(res, 'Group not found', 404);
    return successResponse(res, { group }, 'Group updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function deleteGroup(req, res) {
  try {
    const group = await WardrobeGroup.findOneAndDelete({ _id: req.params.groupId, userId: req.user._id });
    if (!group) return errorResponse(res, 'Group not found', 404);
    await Cloth.updateMany({ userId: req.user._id, groupIds: group._id }, { $pull: { groupIds: group._id } });
    return successResponse(res, {}, 'Group deleted');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = {
  addCloth,
  getCloths,
  getCloth,
  updateCloth,
  deleteCloth,
  markWorn,
  markStatus,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
};
