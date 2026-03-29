/**
 * What it is: Database model for WhatsApp notification logs.
 * Non-tech note: Tracks every WhatsApp reminder sent to members to prevent duplicates.
 */

import mongoose from 'mongoose'

const notificationLogSchema = new mongoose.Schema(
	{
		memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
		memberName: { type: String, required: true },
		phone: { type: String, required: true },
		daysBeforeExpiry: { type: Number, required: true, enum: [7, 3, 1, 0] },
		expiryDate: { type: Date, required: true },
		message: { type: String },
		status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
		error: { type: String },
		sentAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
)

// Index to quickly check if a reminder was already sent for a member + expiry + day combo
notificationLogSchema.index({ memberId: 1, expiryDate: 1, daysBeforeExpiry: 1 }, { unique: true })

export default mongoose.model('NotificationLog', notificationLogSchema)
