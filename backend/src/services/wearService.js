const LaundryLog = require('../models/LaundryLog');

function getLaundryThreshold(cloth, userSettings = {}) {
  if (cloth.maxWearsBeforeLaundry) return cloth.maxWearsBeforeLaundry;
  const defaults = { top: 3, bottom: 3, innerwear: 1, shoes: 5, outerwear: 7, accessory: 5 };
  return userSettings.wearBeforeDirty?.[cloth.category] || defaults[cloth.category] || 3;
}

async function markClothWorn(cloth, user) {
  cloth.lastWornDate = new Date();
  cloth.wearCount = (cloth.wearCount || 0) + 1;
  cloth.wearsSinceWash = (cloth.wearsSinceWash || 0) + 1;

  const threshold = getLaundryThreshold(cloth, user.settings || {});
  if (cloth.wearsSinceWash >= threshold) {
    cloth.status = 'dirty';
    await LaundryLog.create({
      userId: user._id,
      clothId: cloth._id,
      status: 'dirty',
      markedAt: new Date(),
    });
  }

  await cloth.save();
  return cloth;
}

async function updateClothLaundryStatus(cloth, user, status) {
  const prevStatus = cloth.status;
  cloth.status = status;

  if (status === 'clean' && prevStatus !== 'clean') {
    cloth.daysOutsideClean = 0;
    cloth.wearsSinceWash = 0;
    await LaundryLog.findOneAndUpdate(
      { clothId: cloth._id, status: { $in: ['dirty', 'in_wash'] }, resolvedAt: null },
      { status: 'clean', resolvedAt: new Date() },
      { sort: { createdAt: -1 } }
    );
  } else if (status !== prevStatus) {
    await LaundryLog.create({
      userId: user._id,
      clothId: cloth._id,
      status,
      markedAt: new Date(),
    });
  }

  await cloth.save();
  return cloth;
}

module.exports = { getLaundryThreshold, markClothWorn, updateClothLaundryStatus };
