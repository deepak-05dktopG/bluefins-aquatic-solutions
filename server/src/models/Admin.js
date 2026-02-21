import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
	{
		adminId: {
			type: String,
			trim: true,
			lowercase: true,
		},
		email: {
			type: String,
			required: false,
			trim: true,
			lowercase: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ['admin', 'superadmin'],
			default: 'admin',
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
)

adminSchema.index({ email: 1 }, { unique: true, sparse: true })
adminSchema.index({ adminId: 1 }, { unique: true, sparse: true })

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema)

export default Admin
