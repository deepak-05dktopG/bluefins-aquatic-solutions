// DailyTracker.js - Mongoose model for daily money interactions
import mongoose from 'mongoose';

const dailyTrackerSchema = new mongoose.Schema({
  type: { type: String, enum: ['Order', 'Registration', 'Expense', 'Withdrawal'], required: true },
  name: { type: String, required: true },
  paymentType: { type: String, enum: ['cash', 'gpay'], required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:mm
  notes: { type: String },
  // Optionally link to member/payment for registrations
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

export default mongoose.model('DailyTracker', dailyTrackerSchema);
