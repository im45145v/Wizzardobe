const mongoose = require('mongoose');

const laundryLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    clothId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cloth',
    },
    status: {
      type: String,
      enum: ['dirty', 'in_wash', 'clean'],
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: Date,
    daysOutside: {
      type: Number,
      default: 0,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LaundryLog', laundryLogSchema);
