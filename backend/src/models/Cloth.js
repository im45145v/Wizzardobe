const mongoose = require('mongoose');

const clothSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['top', 'bottom', 'shoes', 'accessory', 'outerwear', 'innerwear'],
      required: true,
    },
    color: String,
    fabric: String,
    brand: String,
    occasionTags: [String],
    season: [String],
    imageUrl: String,
    lastWornDate: Date,
    wearCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['clean', 'dirty', 'in_wash'],
      default: 'clean',
    },
    daysOutsideClean: {
      type: Number,
      default: 0,
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'worn', 'retire'],
      default: 'new',
    },
    purchasePrice: Number,
    purchaseDate: Date,
    autoTagData: {
      category: String,
      color: String,
      style: String,
      confidence: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cloth', clothSchema);
