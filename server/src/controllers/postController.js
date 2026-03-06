/**
 * What it is: Posts/announcements API controller.
 * Non-tech note: Manages updates/news items shown on the website.
 */

import Post from '../models/Post.js';

// @desc    Create new post
// @route   POST /api/posts
// @access  Private/Admin
export // Creates a new post/announcement for the website homepage
const createPost = async (req, res) => {
  try {
    const { title, caption, content, imageUrl, cloudinaryPublicId } = req.body;

    // Validate at least one field is provided
    if (!title && !caption && !content && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field (title, caption, content, or image)'
      });
    }

    // Create new post
    const post = await Post.create({
      title,
      caption,
      content,
      imageUrl,
      cloudinaryPublicId
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    
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
      message: 'Failed to create post. Please try again later.'
    });
  }
};

// @desc    Get all active posts
// @route   GET /api/posts
// @access  Public
export // Returns paginated list of active posts for the public website
const getAllPosts = async (req, res) => {
  try {
    const { limit = 50, page = 1, isActive = true } = req.query;

    // Build query
    const query = { isActive: isActive === 'true' || isActive === true };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export // Returns a single post by its database ID
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
};

// @desc    Update post
// @route   PATCH /api/posts/:id
// @access  Private/Admin
export // Updates an existing post (title, content, image, active status)
const updatePost = async (req, res) => {
  try {
    const { title, caption, content, imageUrl, cloudinaryPublicId, isActive } = req.body;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, caption, content, imageUrl, cloudinaryPublicId, isActive },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private/Admin
export // Permanently deletes a post from the database
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};

// @desc    Get posts statistics
// @route   GET /api/posts/stats
// @access  Private/Admin
export // Returns post counts (total, active, recent) for the admin dashboard
const getPostStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const activePosts = await Post.countDocuments({ isActive: true });
    const inactivePosts = await Post.countDocuments({ isActive: false });

    // Get posts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPosts = await Post.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalPosts,
        active: activePosts,
        inactive: inactivePosts,
        lastWeek: recentPosts
      }
    });
  } catch (error) {
    console.error('Error fetching post stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post statistics'
    });
  }
};
