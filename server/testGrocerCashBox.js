// testGrocerCashBox.js
// Run with: node testGrocerCashBox.js (from your server directory)

import mongoose from 'mongoose';
import GrocerCashBox from './src/models/GrocerCashBox.js';

async function main() {
  await mongoose.connect('mongodb://localhost:27017/bluefins', { useNewUrlParser: true, useUnifiedTopology: true });
  const today = new Date().toISOString().slice(0, 10);
  const result = await GrocerCashBox.findOneAndUpdate(
    { date: today },
    {
      $inc: { hardCash: 500 },
      $push: {
        breakdown: {
          type: 'TestEntry',
          amount: 500,
          paymentType: 'cash',
          note: 'Manual test entry',
        },
      },
      $set: { updatedAt: new Date(), updatedBy: 'TestScript' },
    },
    { upsert: true, new: true }
  );
  console.log('GrocerCashBox updated:', result);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
