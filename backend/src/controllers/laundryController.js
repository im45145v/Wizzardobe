const Cloth = require('../models/Cloth');
const { successResponse, errorResponse, getDaysAgo } = require('../utils/helpers');
const { updateClothLaundryStatus } = require('../services/wearService');

async function getLaundry(req, res) {
  try {
    const cloths = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      status: { $in: ['dirty', 'in_wash'] },
    });
    const withDays = cloths.map((c) => ({
      ...c.toObject(),
      daysInLaundry: getDaysAgo(c.updatedAt),
    }));
    return successResponse(res, { cloths: withDays }, 'Laundry items fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function updateLaundry(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['clean', 'dirty', 'in_wash'];
    if (!validStatuses.includes(status)) return errorResponse(res, 'Invalid status', 400);

    const cloth = await Cloth.findOne({ _id: req.params.clothId, userId: req.user._id, isActive: true });
    if (!cloth) return errorResponse(res, 'Cloth not found', 404);

    await updateClothLaundryStatus(cloth, req.user, status);
    return successResponse(res, { cloth }, 'Laundry status updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getOverdue(req, res) {
  try {
    const laundryAlertDays = req.user.settings?.laundryAlertDays || 10;
    const cutoffDate = new Date(Date.now() - laundryAlertDays * 24 * 60 * 60 * 1000);

    const cloths = await Cloth.find({
      userId: req.user._id,
      isActive: true,
      status: { $in: ['dirty', 'in_wash'] },
      updatedAt: { $lt: cutoffDate },
    });

    return successResponse(res, { cloths, count: cloths.length }, 'Overdue items fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getLaundryStats(req, res) {
  try {
    const laundryAlertDays = req.user.settings?.laundryAlertDays || 10;
    const cutoffDate = new Date(Date.now() - laundryAlertDays * 24 * 60 * 60 * 1000);

    const [dirty, inWash, overdue] = await Promise.all([
      Cloth.countDocuments({ userId: req.user._id, isActive: true, status: 'dirty' }),
      Cloth.countDocuments({ userId: req.user._id, isActive: true, status: 'in_wash' }),
      Cloth.countDocuments({
        userId: req.user._id,
        isActive: true,
        status: { $in: ['dirty', 'in_wash'] },
        updatedAt: { $lt: cutoffDate },
      }),
    ]);

    return successResponse(res, { dirty, inWash, overdue, total: dirty + inWash }, 'Laundry stats fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { getLaundry, updateLaundry, getOverdue, getLaundryStats };
