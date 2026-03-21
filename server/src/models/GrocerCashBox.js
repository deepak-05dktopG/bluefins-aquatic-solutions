// GrocerCashBox.js
// Schema for tracking the swimming pool's cash box (hard cash and GPay only)

import mongoose from 'mongoose';

const GrocerCashBoxSchema = new mongoose.Schema({
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
});

const GrocerCashBox = mongoose.model('GrocerCashBox', GrocerCashBoxSchema);
export default GrocerCashBox;
