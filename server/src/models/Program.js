import mongoose from 'mongoose'

const programSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Add other fields as needed
  },
  {
    timestamps: true,
  }
)

const Program = mongoose.model('Program', programSchema)

export default Program