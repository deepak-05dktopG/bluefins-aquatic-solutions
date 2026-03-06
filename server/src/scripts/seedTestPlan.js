/**
 * What it is: Developer seed script that creates a ₹1 test plan.
 * Non-tech note: Only use for testing payment flow (not for real pricing).
 * Command: `cd server` then `npm run seed-test-plan`
 */

import '../config/env.js'
import connectDB from '../config/db.js'
import MembershipPlan from '../models/MembershipPlan.js'

// Creates a ₹1 test membership plan in MongoDB for end-to-end payment testing
// Developer-only seed.
// Creates a ₹1 public entry plan for testing payments end-to-end.

const main = async () => {
    await connectDB()

    const plan = {
		planName: 'Test Public Entry (₹1)',
		type: 'public',
		categoryRequired: false,
		durationInMinutes: 60,
		basePrice: 1,
		publicEntryWindow: { startTime: '10:00', endTime: '15:00' },
		isRecurring: false,
		isActive: true,
	}

    await MembershipPlan.updateOne(
		{ type: plan.type, planName: plan.planName },
		{ $set: plan },
		{ upsert: true }
	)

    console.log('✅ Seeded test plan:', plan.planName)
    process.exit(0)
};

main().catch(
// Logs the error and exits if test plan seeding fails
e => {
    console.error('❌ Failed to seed test plan:', e?.message || e)
    process.exit(1)
})
