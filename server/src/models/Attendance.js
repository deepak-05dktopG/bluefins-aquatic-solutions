/**
 * What it is: Database model for attendance entries.
 * Non-tech note: Stores “who attended on which day” records.
 */

import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
	{
		memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
		// Calendar day key for business reporting & de-duplication (YYYY-MM-DD).
		// This field exists to support a unique index on (memberId, date).
		date: { type: String, required: true, trim: true, index: true },
		scannedAt: { type: Date, default: Date.now, index: true },
		method: { type: String, enum: ['qr', 'manual'], default: 'qr' },
		rawPayload: { type: String, trim: true },
		result: { type: String, enum: ['accepted', 'rejected'], default: 'accepted' },
		reason: { type: String, trim: true },
		meta: {
			ip: { type: String },
			userAgent: { type: String },
		},
	},
	{ timestamps: true }
)

attendanceSchema.index({ memberId: 1, scannedAt: -1 })
attendanceSchema.index({ memberId: 1, date: 1 }, { unique: true })

export default mongoose.model('Attendance', attendanceSchema)
