import mongoose from 'mongoose'

const markettingSchema = new mongoose.Schema(
	{
		customerName: { type: String, trim: true },
		whatsappNumber: { type: String, required: true, trim: true, unique: true, index: true },
		sources: { type: [String], default: [] },
	},
	{ timestamps: true, collection: 'marketting' }
)

export default mongoose.model('Marketting', markettingSchema)
