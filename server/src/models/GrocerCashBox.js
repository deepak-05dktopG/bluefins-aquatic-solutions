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
    lifetimeExpense: {
      type: Number,
      default: 0,
    },
    lifetimeWithdrawal: {
      type: Number,
      default: 0,
    },
    orderStats: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    oneHourOrderStats: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    membershipStats: [
      {
        planName: { type: String, required: true },
        count: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
      }
    ],
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
