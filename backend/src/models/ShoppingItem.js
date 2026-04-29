const mongoose = require('mongoose');

const shoppingItemSchema = new mongoose.Schema(
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
    category: String,
    reason: String,
    link: String,
    estimatedPrice: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    pairsWithItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cloth',
      },
    ],
    status: {
      type: String,
      enum: ['wishlist', 'purchased', 'rejected'],
      default: 'wishlist',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShoppingItem', shoppingItemSchema);
