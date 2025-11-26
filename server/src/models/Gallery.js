import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required']
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required']
    },
    category: {
      type: String,
      enum: ['training', 'events', 'facilities', 'achievements', 'other'],
      default: 'other'
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
gallerySchema.index({ isActive: 1, displayOrder: 1 });
gallerySchema.index({ category: 1 });

const Gallery = mongoose.model('Gallery', gallerySchema);

export default Gallery;
