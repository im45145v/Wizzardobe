const mongoose = require('mongoose');

const wardrobeGroupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    type: {
      type: String,
      enum: ['capsule', 'travel', 'work', 'gym', 'favorites', 'seasonal', 'custom'],
      default: 'custom',
    },
    color: String,
    notes: String,
  },
  { timestamps: true }
);

wardrobeGroupSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('WardrobeGroup', wardrobeGroupSchema);
