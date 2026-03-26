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

// Get ALL tracker entries (no date filter), with optional type/paymentType/date range filters
export const getAllTrackerEntries = async (req, res) => {
  try {
    const { type, paymentType, fromDate, toDate, limit: limitParam } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (paymentType) filter.paymentType = (paymentType || '').toLowerCase();
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = fromDate;
      if (toDate) filter.date.$lte = toDate;
    }
    const limitNum = Math.min(Number.isFinite(Number(limitParam)) ? Number(limitParam) : 500, 1000);
    const entries = await DailyTracker.find(filter).sort({ date: -1, time: -1 }).limit(limitNum);
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

// Update a tracker entry (with cash box adjustment)
export const updateDailyTrackerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const oldEntry = await DailyTracker.findById(id);
    if (!oldEntry) return res.status(404).json({ success: false, message: 'Entry not found' });

    // Step 1: Revert old entry's effect on cash box
    if (oldEntry.amount && oldEntry.paymentType) {
      let revertAmount = 0;
      if (oldEntry.type === 'Order' || oldEntry.type === 'Registration') revertAmount = -oldEntry.amount;
      else if (oldEntry.type === 'Expense' || oldEntry.type === 'Withdrawal') revertAmount = oldEntry.amount;
      
      if (revertAmount !== 0) {
        await incrementCashBox({ amount: revertAmount, paymentType: oldEntry.paymentType });
      }
    }

    // Step 2: Update the entry
    const updatedEntry = await DailyTracker.findByIdAndUpdate(id, updates, { new: true });

    // Step 3: Apply new entry's effect on cash box
    if (updatedEntry.amount && updatedEntry.paymentType) {
      let applyAmount = 0;
      if (updatedEntry.type === 'Order' || updatedEntry.type === 'Registration') applyAmount = updatedEntry.amount;
      else if (updatedEntry.type === 'Expense' || updatedEntry.type === 'Withdrawal') applyAmount = -updatedEntry.amount;
      
      if (applyAmount !== 0) {
        await incrementCashBox({ amount: applyAmount, paymentType: updatedEntry.paymentType });
      }
    }

    res.json({ success: true, data: updatedEntry });
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

// Delete a single tracker entry by ID (with cash box adjustment)
export const deleteDailyTrackerById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await DailyTracker.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    // Step 1: Revert its effect on cash box
    if (entry.amount && entry.paymentType) {
      let revertAmount = 0;
      if (entry.type === 'Order' || entry.type === 'Registration') revertAmount = -entry.amount;
      else if (entry.type === 'Expense' || entry.type === 'Withdrawal') revertAmount = entry.amount;
      
      if (revertAmount !== 0) {
        await incrementCashBox({ amount: revertAmount, paymentType: entry.paymentType });
      }
    }

    // Step 2: Delete
    await DailyTracker.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete all tracker entries (full purge)
export const deleteAllTrackerEntries = async (req, res) => {
  try {
    const result = await DailyTracker.deleteMany({});
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
