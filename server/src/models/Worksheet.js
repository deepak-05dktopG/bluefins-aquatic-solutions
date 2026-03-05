import mongoose from 'mongoose';

const worksheetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  caption: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    required: [true, 'Link is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Basic URL validation
		return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  linkType: {
    type: String,
    enum: ['google-form', 'google-drive', 'other'],
    default: 'other'
  },
  createdBy: {
    type: String,
    default: 'Admin',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
worksheetSchema.index({ createdAt: -1 });
worksheetSchema.index({ isActive: 1 });
worksheetSchema.index({ linkType: 1 });

const Worksheet = mongoose.model('Worksheet', worksheetSchema);

export default Worksheet;
