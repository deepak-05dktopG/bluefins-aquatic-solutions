/**
 * What it is: Database model for membership plans (prices, durations, types).
 * Non-tech note: Defines the different plans people can buy.
 */

import mongoose from 'mongoose'

const categoryPriceSchema = new mongoose.Schema(
	{
		category: { type: String, enum: ['infant', 'kids', 'adult'], required: true },
		price: { type: Number, required: true, min: 0 },
	},
	{ _id: false }
)

const membershipPlanSchema = new mongoose.Schema(
	{
		planName: { type: String, required: true, trim: true },
		type: {
			type: String,
			enum: ['summer', 'monthly', 'yearly', 'family', 'public'],
			required: true,
			index: true,
		},

		categoryRequired: { type: Boolean, default: false },

		durationInDays: { type: Number, min: 1 },
		durationInMinutes: { type: Number, min: 1 },

		basePrice: { type: Number, required: true, min: 0 },
		originalPrice: { type: Number, min: 0 },
		categoryPrices: { type: [categoryPriceSchema], default: [] },

		maxMembers: { type: Number, min: 1 },
		isRecurring: { type: Boolean, default: false },

		addOns: {
			coachingAddOnMonthly: { type: Number, min: 0 },
		},

		publicEntryWindow: {
			startTime: { type: String },
			endTime: { type: String },
		},

		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
)

export default mongoose.model('MembershipPlan', membershipPlanSchema)
