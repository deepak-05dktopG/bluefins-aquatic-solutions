import DailyTracker from '../models/DailyTracker.js';
import GrocerCashBox from '../models/GrocerCashBox.js';
import MembershipPlan from '../models/MembershipPlan.js';
import { incrementCashBox } from './grocerCashBoxController.js';

// Helper to ensure all active plans are physically initialized in the CashBox document
const ensureCashBoxStats = async (cashBox) => {
  if (!cashBox) return;
  const plans = await MembershipPlan.find({ isActive: true });
  let updated = false;
  
  if (!cashBox.orderStats) { cashBox.orderStats = { count: 0, amount: 0 }; updated = true; }
  if (!cashBox.oneHourOrderStats) { cashBox.oneHourOrderStats = { count: 0, amount: 0 }; updated = true; }
  if (!cashBox.membershipStats) { cashBox.membershipStats = []; updated = true; }

  for (const plan of plans) {
    const exists = cashBox.membershipStats.find(p => p.planName === plan.planName);
    if (!exists) {
      cashBox.membershipStats.push({ planName: plan.planName, count: 0, amount: 0 });
      updated = true;
    }
  }

  if (updated) {
    await cashBox.save();
  }
};

// Get all tracker entries for a specific date (YYYY-MM-DD)
export const getDailyTrackerByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });
    const entries = await DailyTracker.find({ date }).sort({ time: 1, createdAt: 1 });
    let cashBox = await GrocerCashBox.findOne({});
    if (cashBox) await ensureCashBoxStats(cashBox);
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
    const limitNum = Math.min(Number.isFinite(Number(limitParam)) ? Number(limitParam) : 500, 10000);
    const entries = await DailyTracker.find(filter).sort({ date: -1, time: -1 }).limit(limitNum);
    let cashBox = await GrocerCashBox.findOne({});
    if (cashBox) await ensureCashBoxStats(cashBox);
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
      if (entry.type !== 'Expense' && entry.type !== 'Withdrawal') {
        try {
          await incrementCashBox({
            amount: entry.amount,
            paymentType: entry.paymentType,
            entryType: entry.type,
            entryCountDelta: 1,
            entryTotalDelta: entry.amount
          });
        } catch (err) {
          console.error('Error incrementing GrocerCashBox for DailyTracker Order/1 Hour Order:', err);
        }
      } else if (entry.type === 'Expense' || entry.type === 'Withdrawal') {
        try {
          await incrementCashBox({
            amount: -entry.amount,
            paymentType: entry.paymentType,
            expenseDelta: entry.type === 'Expense' ? entry.amount : 0,
            withdrawalDelta: entry.type === 'Withdrawal' ? entry.amount : 0,
            entryType: entry.type,
            entryCountDelta: 1,
            entryTotalDelta: entry.amount
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
      let revertExpense = 0;
      let revertWithdrawal = 0;
      if (oldEntry.type !== 'Expense' && oldEntry.type !== 'Withdrawal') revertAmount = -oldEntry.amount;
      else if (oldEntry.type === 'Expense') { revertAmount = oldEntry.amount; revertExpense = -oldEntry.amount; }
      else if (oldEntry.type === 'Withdrawal') { revertAmount = oldEntry.amount; revertWithdrawal = -oldEntry.amount; }

      if (revertAmount !== 0 || revertExpense !== 0 || revertWithdrawal !== 0) {
        await incrementCashBox({ amount: revertAmount, paymentType: oldEntry.paymentType, expenseDelta: revertExpense, withdrawalDelta: revertWithdrawal, entryType: oldEntry.type, entryCountDelta: -1, entryTotalDelta: -oldEntry.amount });
      }
    }

    // Step 2: Update the entry
    const updatedEntry = await DailyTracker.findByIdAndUpdate(id, updates, { new: true });

    // Step 3: Apply new entry's effect on cash box
    if (updatedEntry.amount && updatedEntry.paymentType) {
      let applyAmount = 0;
      let applyExpense = 0;
      let applyWithdrawal = 0;
      if (updatedEntry.type !== 'Expense' && updatedEntry.type !== 'Withdrawal') applyAmount = updatedEntry.amount;
      else if (updatedEntry.type === 'Expense') { applyAmount = -updatedEntry.amount; applyExpense = updatedEntry.amount; }
      else if (updatedEntry.type === 'Withdrawal') { applyAmount = -updatedEntry.amount; applyWithdrawal = updatedEntry.amount; }

      if (applyAmount !== 0 || applyExpense !== 0 || applyWithdrawal !== 0) {
        await incrementCashBox({ amount: applyAmount, paymentType: updatedEntry.paymentType, expenseDelta: applyExpense, withdrawalDelta: applyWithdrawal, entryType: updatedEntry.type, entryCountDelta: 1, entryTotalDelta: updatedEntry.amount });
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
      let revertExpense = 0;
      let revertWithdrawal = 0;
      if (entry.type !== 'Expense' && entry.type !== 'Withdrawal') revertAmount = -entry.amount;
      else if (entry.type === 'Expense') { revertAmount = entry.amount; revertExpense = -entry.amount; }
      else if (entry.type === 'Withdrawal') { revertAmount = entry.amount; revertWithdrawal = -entry.amount; }

      if (revertAmount !== 0 || revertExpense !== 0 || revertWithdrawal !== 0) {
        await incrementCashBox({ amount: revertAmount, paymentType: entry.paymentType, expenseDelta: revertExpense, withdrawalDelta: revertWithdrawal, entryType: entry.type, entryCountDelta: -1, entryTotalDelta: -entry.amount });
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
