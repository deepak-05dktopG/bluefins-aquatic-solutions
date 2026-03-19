// dailyTrackerController.js - Controller for Daily Tracker API
import DailyTracker from '../models/DailyTracker.js';

// Get all tracker entries for a specific date (YYYY-MM-DD)
export const getDailyTrackerByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    const entries = await DailyTracker.find({ date }).sort({ time: 1, createdAt: 1 });
    res.json({ success: true, data: entries });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Add a new tracker entry
export const addDailyTrackerEntry = async (req, res) => {
  try {
    const entry = new DailyTracker(req.body);
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// Delete all tracker entries for a specific date
export const deleteDailyTrackerByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    await DailyTracker.deleteMany({ date });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
