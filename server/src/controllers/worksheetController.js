/**
 * What it is: Worksheets API controller.
 * Non-tech note: Manages weekly worksheet links/resources for the team.
 */

import Worksheet from '../models/Worksheet.js';

// @desc    Create new worksheet link
// @route   POST /api/worksheets
// @access  Private/Admin
export // Saves a new worksheet link (Google Form/Drive) shared by admin
const createWorksheet = async (req, res) => {
  try {
    const { title, caption, message, link, linkType, createdBy } = req.body;

    // Validate required fields
    if (!title || !link) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and link'
      });
    }

    // Create new worksheet
    const worksheet = await Worksheet.create({
      title,
      caption,
      message,
      link,
      linkType,
      createdBy: createdBy || 'Admin'
    });

    res.status(201).json({
      success: true,
      message: 'Worksheet link shared successfully',
      data: worksheet
    });
  } catch (error) {
    console.error('Error creating worksheet:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
      // Extract each validation error message
      err => {
        return err.message;
      });
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to share worksheet link. Please try again later.'
    });
  }
};

// @desc    Get all worksheets
// @route   GET /api/worksheets
// @access  Private/Team
export // Returns paginated list of worksheet links for the team
const getAllWorksheets = async (req, res) => {
  try {
    const { isActive = true, linkType, limit = 50, page = 1 } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }
    if (linkType && linkType !== 'all') {
      query.linkType = linkType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get worksheets with pagination
    const worksheets = await Worksheet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await Worksheet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: worksheets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: worksheets
    });
  } catch (error) {
    console.error('Error fetching worksheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worksheets'
    });
  }
};

// @desc    Get single worksheet by ID
// @route   GET /api/worksheets/:id
// @access  Private/Team
export // Returns a single worksheet link by its database ID
const getWorksheetById = async (req, res) => {
  try {
    const worksheet = await Worksheet.findById(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: worksheet
    });
  } catch (error) {
    console.error('Error fetching worksheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worksheet'
    });
  }
};

// @desc    Update worksheet
// @route   PATCH /api/worksheets/:id
// @access  Private/Admin
export // Updates worksheet details (title, link, type, active status)
const updateWorksheet = async (req, res) => {
  try {
    const { title, caption, message, link, linkType, isActive } = req.body;

    const worksheet = await Worksheet.findByIdAndUpdate(
      req.params.id,
      { title, caption, message, link, linkType, isActive },
      { new: true, runValidators: true }
    );

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worksheet updated successfully',
      data: worksheet
    });
  } catch (error) {
    console.error('Error updating worksheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worksheet'
    });
  }
};

// @desc    Delete worksheet
// @route   DELETE /api/worksheets/:id
// @access  Private/Admin
export // Permanently removes a worksheet link from the database
const deleteWorksheet = async (req, res) => {
  try {
    const worksheet = await Worksheet.findByIdAndDelete(req.params.id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worksheet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting worksheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete worksheet'
    });
  }
};

// @desc    Increment click count
// @route   PATCH /api/worksheets/:id/click
// @access  Public
export // Tracks worksheet link clicks for analytics
const incrementClick = async (req, res) => {
  try {
    const worksheet = await Worksheet.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: worksheet
    });
  } catch (error) {
    console.error('Error incrementing click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click'
    });
  }
};

// @desc    Get worksheets statistics
// @route   GET /api/worksheets/stats
// @access  Private/Admin
export // Returns worksheet counts and click stats for the admin dashboard
const getWorksheetStats = async (req, res) => {
  try {
    const totalWorksheets = await Worksheet.countDocuments();
    const activeWorksheets = await Worksheet.countDocuments({ isActive: true });
    const googleForms = await Worksheet.countDocuments({ linkType: 'google-form' });
    const googleDrive = await Worksheet.countDocuments({ linkType: 'google-drive' });
    
    // Get total clicks
    const clickStats = await Worksheet.aggregate([
      { $group: { _id: null, totalClicks: { $sum: '$clicks' } } }
    ]);
    const totalClicks = clickStats.length > 0 ? clickStats[0].totalClicks : 0;

    // Get worksheets from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWorksheets = await Worksheet.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalWorksheets,
        active: activeWorksheets,
        googleForms,
        googleDrive,
        totalClicks,
        lastWeek: recentWorksheets
      }
    });
  } catch (error) {
    console.error('Error fetching worksheet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worksheet statistics'
    });
  }
};
