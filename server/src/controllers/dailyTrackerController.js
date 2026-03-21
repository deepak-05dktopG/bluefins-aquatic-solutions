// dailyTrackerController.js - Controller for Daily Tracker API
import DailyTracker from '../models/DailyTracker.js';
import { incrementCashBox } from './grocerCashBoxController.js';
import GrocerCashBox from '../models/GrocerCashBox.js';

// Get all tracker entries for a specific date (YYYY-MM-DD)
export const getDailyTrackerByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    const entries = await DailyTracker.find({ date }).sort({ time: 1, createdAt: 1 });
    const cashBox = await GrocerCashBox.findOne({});
    res.json({ success: true, data: entries, cashBox: cashBox || { hardCash: 0, gpayCash: 0 } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Add a new tracker entry
export const addDailyTrackerEntry = async (req, res) => {
  try {
    const entry = new DailyTracker(req.body);

    if (entry.amount && entry.paymentType && (entry.type === 'Expense' || entry.type === 'Withdrawal')) {
      const cashBox = await GrocerCashBox.findOne({});
      const available = cashBox ? (entry.paymentType === 'cash' ? cashBox.hardCash : cashBox.gpayCash) : 0;
      if (entry.amount > available) {
        return res.status(400).json({ success: false, message: `Insufficient ${entry.paymentType === 'cash' ? 'Cash' : 'GPay'} balance in Grocer Box` });
      }
    }

    await entry.save();

    if (entry.amount && entry.paymentType) {
      if (entry.type === 'Order') {
        try {
          await incrementCashBox({
              amount: entry.amount,
              paymentType: entry.paymentType,
          });
        } catch (err) {
          console.error('Error incrementing GrocerCashBox for DailyTracker Order:', err);
        }
      } else if (entry.type === 'Expense' || entry.type === 'Withdrawal') {
        try {
          await incrementCashBox({
              amount: -entry.amount,
              paymentType: entry.paymentType,
          });
        } catch (err) {
          console.error(`Error decrementing GrocerCashBox for DailyTracker ${entry.type}:`, err);
        }
      }
    }

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
