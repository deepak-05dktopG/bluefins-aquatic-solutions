/**
 * What it is: Database model for a member (MongoDB/Mongoose schema).
 * Non-tech note: Defines what information we store for each member.
 */

import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		phone: { type: String, required: true, trim: true },
		age: { type: Number, min: 0 },
		gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },

		planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
		// Offline-only: when admin applies a discount during desk registration.
		discountPct: { type: Number, min: 0, max: 100, default: 0 },
		// Offline-only: how the member paid at the counter.
		paymentMethod: { type: String, enum: ['cash', 'gpay', 'phonepay', 'paytm'], default: 'cash' },
		planType: { type: String },
		category: { type: String, enum: ['infant', 'kids', 'adult'] },
		membershipGroupId: { type: String, index: true },

		joinDate: { type: Date, required: true, default: Date.now },
		expiryDate: { type: Date, required: true },
		status: { type: String, enum: ['active', 'expired'], default: 'active' },

		// All-time unique-day visit count (accepted QR attendance days).
		attendanceDaysCount: { type: Number, default: 0, min: 0 },

		publicSlot: {
			date: { type: String },
			startTime: { type: String },
			endTime: { type: String },
			quantity: { type: Number, min: 1 },
		},

		qrCode: { type: String },
		qrPayload: { type: String },

		reminderSent: { type: Boolean, default: false },
	},
	{ timestamps: true }
)

export default mongoose.model('Member', memberSchema)
