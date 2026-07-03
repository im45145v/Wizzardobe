const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    outfitItems: [
      {
        clothId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Cloth',
        },
        clothName: String,
        imageUrl: String,
      },
    ],
    mode: String,
    weatherData: {
      type: mongoose.Schema.Types.Mixed,
    },
    calendarEvents: [String],
    aiReasoning: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    wasWorn: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Suggestion', suggestionSchema);
