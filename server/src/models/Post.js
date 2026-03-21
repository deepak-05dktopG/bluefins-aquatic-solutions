/**
 * What it is: Database model for posts/announcements.
 * Non-tech note: Stores the updates/nes items shown in the app.
 */

import mongoose from 'mongoose';
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  caption: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ createdAt: -1 });
postSchema.index({ isActive: 1 });

// Validation: At least one field must be provided
// Ensures every post has at least a title, caption, content, or image before saving
postSchema.pre('validate', function(next) {
  if (!this.title && !this.caption && !this.content && !this.imageUrl) {
    next(new Error('Post must have at least one field (title, caption, content, or image)'));
  } else {
    next();
  }
});

const Post = mongoose.model('Post', postSchema);

export default Post;
