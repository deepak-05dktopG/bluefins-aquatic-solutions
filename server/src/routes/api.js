import express from 'express';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats
} from '../controllers/feedbackController.js';
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostStats
} from '../controllers/postController.js';
import {
  createWorksheet,
  getAllWorksheets,
  getWorksheetById,
  updateWorksheet,
  deleteWorksheet,
  incrementClick,
  getWorksheetStats
} from '../controllers/worksheetController.js';
import {
  createGalleryImage,
  getAllGalleryImages,
  getGalleryImageById,
  updateGalleryImage,
  deleteGalleryImage,
  getGalleryStats
} from '../controllers/galleryController.js';

const router = express.Router();

// Feedback routes
// Public routes
router.post('/feedback', createFeedback);
// Admin routes (you can add auth middleware later)
router.get('/feedback', getAllFeedback);
router.get('/feedback/stats', getFeedbackStats);
router.get('/feedback/:id', getFeedbackById);
router.patch('/feedback/:id', updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);

// Post routes
// Public routes
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
// Admin routes (you can add auth middleware later)
router.post('/posts', createPost);
router.get('/posts/stats', getPostStats);
router.patch('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Worksheet routes
// Team/Admin routes (accessible to team members)
router.get('/worksheets', getAllWorksheets);
router.get('/worksheets/stats', getWorksheetStats);
router.get('/worksheets/:id', getWorksheetById);
router.post('/worksheets', createWorksheet);
router.patch('/worksheets/:id', updateWorksheet);
router.delete('/worksheets/:id', deleteWorksheet);
router.patch('/worksheets/:id/click', incrementClick);

// Gallery routes
// Public routes
router.get('/gallery', getAllGalleryImages);
router.get('/gallery/:id', getGalleryImageById);
// Admin routes
router.post('/gallery', createGalleryImage);
router.get('/gallery/stats', getGalleryStats);
router.patch('/gallery/:id', updateGalleryImage);
router.delete('/gallery/:id', deleteGalleryImage);

export default router;
