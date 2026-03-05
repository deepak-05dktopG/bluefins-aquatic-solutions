/**
 * What it is: Gallery API controller.
 * Non-tech note: Manages gallery images shown on the website.
 */

import Gallery from '../models/Gallery.js';

// @desc    Create new gallery image
// @route   POST /api/gallery
// @access  Admin
export /**
 * Purpose: Create Gallery Image
 * Plain English: What this function is used for.
 */
const createGalleryImage = async (req, res) => {
  try {
    const { title, description, imageUrl, cloudinaryPublicId, category, displayOrder } = req.body;

    // Validate required fields
    if (!imageUrl || !cloudinaryPublicId) {
      return res.status(400).json({
        success: false,
        message: 'Image URL and Cloudinary Public ID are required'
      });
    }

    const gallery = await Gallery.create({
      title,
      description,
      imageUrl,
      cloudinaryPublicId,
      category: category || 'other',
      displayOrder: displayOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Gallery image added successfully',
      data: gallery
    });
  } catch (error) {
    console.error('Error creating gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery image',
      error: error.message
    });
  }
};

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
export /**
 * Purpose: Get All Gallery Images
 * Plain English: What this function is used for.
 */
const getAllGalleryImages = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const images = await Gallery.find(filter)
      .sort({ displayOrder: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery images',
      error: error.message
    });
  }
};

// @desc    Get single gallery image
// @route   GET /api/gallery/:id
// @access  Public
export /**
 * Purpose: Get Gallery Image By Id
 * Plain English: What this function is used for.
 */
const getGalleryImageById = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    console.error('Error fetching gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery image',
      error: error.message
    });
  }
};

// @desc    Update gallery image
// @route   PATCH /api/gallery/:id
// @access  Admin
export /**
 * Purpose: Do Update Gallery Image
 * Plain English: What this function is used for.
 */
const updateGalleryImage = async (req, res) => {
  try {
    const { title, description, category, displayOrder, isActive } = req.body;

    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    // Update fields
    if (title !== undefined) image.title = title;
    if (description !== undefined) image.description = description;
    if (category !== undefined) image.category = category;
    if (displayOrder !== undefined) image.displayOrder = displayOrder;
    if (isActive !== undefined) image.isActive = isActive;

    await image.save();

    res.status(200).json({
      success: true,
      message: 'Gallery image updated successfully',
      data: image
    });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery image',
      error: error.message
    });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Admin
export /**
 * Purpose: Do Delete Gallery Image
 * Plain English: What this function is used for.
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    await image.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery image',
      error: error.message
    });
  }
};

// @desc    Get gallery statistics
// @route   GET /api/gallery/stats
// @access  Admin
export /**
 * Purpose: Get Gallery Stats
 * Plain English: What this function is used for.
 */
const getGalleryStats = async (req, res) => {
  try {
    const totalImages = await Gallery.countDocuments();
    const activeImages = await Gallery.countDocuments({ isActive: true });
    const inactiveImages = await Gallery.countDocuments({ isActive: false });
    
    const categoryStats = await Gallery.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalImages,
        activeImages,
        inactiveImages,
        categoryStats: categoryStats.reduce(/**
         * Purpose: Array reduce callback (combines items into one result)
         * Plain English: What this function is used for.
         */
        (acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching gallery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery statistics',
      error: error.message
    });
  }
};
