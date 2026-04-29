const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        clothId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Cloth',
        },
        clothName: String,
      },
    ],
    name: String,
    occasion: String,
    season: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    wornDate: Date,
    isAISuggested: {
      type: Boolean,
      default: false,
    },
    suggestionMode: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Outfit', outfitSchema);
