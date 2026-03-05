/**
 * What it is: Database model for payments.
 * Non-tech note: Stores payment/order details for memberships.
 */

import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
	{
		planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },

		memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
		memberIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Member', default: [] },

		orderId: { type: String, required: true, unique: true, index: true },
		providerOrderId: { type: String, unique: true, index: true, sparse: true },
		paymentId: { type: String },
		providerSignature: { type: String },

		amount: { type: Number, required: true },
		pricing: {
			subtotal: { type: Number },
			commission: { type: Number },
			gst: { type: Number },
			total: { type: Number },
			config: {
				commissionPct: { type: Number },
				commissionFlatInr: { type: Number },
				gstPct: { type: Number },
			},
		},
		currency: { type: String, default: 'INR' },

		status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
		// `mock` is kept for legacy documents. New documents should use `cash` for offline/manual payments.
		provider: { type: String, enum: ['cash', 'mock', 'razorpay'], default: 'cash' },
		collectedBy: { type: String, trim: true },

		membershipGroupId: { type: String, index: true },

		selection: {
			category: { type: String },
			coachingAddOn: { type: Boolean },
			quantity: { type: Number },
			publicSlot: {
				date: { type: String },
				startTime: { type: String },
				endTime: { type: String },
			},
		},

		memberDraft: {
			name: { type: String },
			phone: { type: String },
			age: { type: Number },
			gender: { type: String },
		},

		familyMembersDraft: {
			type: [
				{
					name: { type: String },
					phone: { type: String },
					age: { type: Number },
					gender: { type: String },
				},
			],
			default: [],
		},
	},
	{ timestamps: true }
)

export default mongoose.model('Payment', paymentSchema)
