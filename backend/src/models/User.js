const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
    },
    openaiApiKey: {
      type: String,
    },
    weatherApiKey: {
      type: String,
    },
    profile: {
      gender: String,
      bodyType: String,
      skinTone: String,
      stylePreference: {
        type: String,
        enum: ['streetwear', 'minimalist', 'formal', 'casual'],
      },
      occasions: [String],
      location: String,
    },
    settings: {
      cooldownDays: {
        type: Number,
        default: 3,
      },
      wearBeforeDirty: {
        top: { type: Number, default: 3 },
        bottom: { type: Number, default: 3 },
        innerwear: { type: Number, default: 1 },
        shoes: { type: Number, default: 5 },
        outerwear: { type: Number, default: 7 },
      },
      laundryAlertDays: {
        type: Number,
        default: 10,
      },
    },
    googleCalendar: {
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
