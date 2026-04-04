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

		reminderSent7: { type: Boolean, default: false },
		reminderSent3: { type: Boolean, default: false },
		reminderSent1: { type: Boolean, default: false },

		// Partial payment tracking
		paidAmount: { type: Number, default: null },
		pendingAmount: { type: Number, default: 0 },
		paymentStatus: { type: String, enum: ['paid', 'partial', 'pending'], default: 'paid' },
	},
	{ timestamps: true }
)

export default mongoose.model('Member', memberSchema)
