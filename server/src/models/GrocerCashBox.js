import mongoose from 'mongoose';

const grocerCashBoxSchema = new mongoose.Schema(
  {
    hardCash: {
      type: Number,
      required: true,
      default: 0,
    },
    gpayCash: {
      type: Number,
      required: true,
      default: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose model lookup pattern to prevent OverwriteModelError in hot reloads
const GrocerCashBox = mongoose.models.GrocerCashBox || mongoose.model('GrocerCashBox', grocerCashBoxSchema);

export default GrocerCashBox;
