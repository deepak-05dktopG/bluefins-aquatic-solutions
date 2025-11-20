import express from 'express';
import {
  createFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  getFeedbackStats
} from '../controllers/feedbackController.js';

const router = express.Router();

// Public routes
router.post('/feedback', createFeedback);
// Admin routes (you can add auth middleware later)
router.get('/feedback', getAllFeedback);
router.get('/feedback/stats', getFeedbackStats);
router.get('/feedback/:id', getFeedbackById);
router.patch('/feedback/:id', updateFeedbackStatus);
router.delete('/feedback/:id', deleteFeedback);

export default router;
