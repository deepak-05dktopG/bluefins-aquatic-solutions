import GrocerCashBox from '../models/GrocerCashBox.js';

// Increment the cash box for a payment (cash or gpay)
export async function incrementCashBox({ amount, paymentType }) {
  if (!['cash', 'gpay'].includes(paymentType)) return;
  const update = {
    $inc: {},
    $set: { updatedAt: new Date() },
  };
  if (paymentType === 'cash') update.$inc.hardCash = amount;
  if (paymentType === 'gpay') update.$inc.gpayCash = amount;
  await GrocerCashBox.findOneAndUpdate(
    {}, // always update the single cash box document
    update,
    { upsert: true, new: true }
  );
}
