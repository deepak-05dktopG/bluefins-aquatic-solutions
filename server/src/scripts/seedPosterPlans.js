/**
 * What it is: Seed script for the official membership plans (poster plans).
 * Non-tech note: Run this once to create the standard plan list in the database.
 * Command: `cd server` then `npm run seed-poster-plans`
 */

import '../config/env.js'
import connectDB from '../config/db.js'
import MembershipPlan from '../models/MembershipPlan.js'

// Seeds the "official" membership + coaching plans as per the poster.
// Safe to run multiple times (upserts by {type, planName}).

const officialPlans = [
	{
		planName: 'Public Batch (Per Session)',
		type: 'public',
		categoryRequired: false,
		durationInMinutes: 60,
		basePrice: 150,
		publicEntryWindow: { startTime: '10:00', endTime: '15:00' },
		isRecurring: false,
		isActive: true,
	},
	{
		planName: 'Monthly Membership',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 30,
		basePrice: 3000,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: '3 Monthly Membership',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 90,
		basePrice: 4999,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: '6 Monthly Membership',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 180,
		basePrice: 7499,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: 'Yearly Membership',
		type: 'yearly',
		categoryRequired: false,
		durationInDays: 365,
		basePrice: 12000,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: 'Infant (Per Month)',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 30,
		basePrice: 4000,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: 'Family Membership (Max 4 Members)',
		type: 'family',
		categoryRequired: false,
		durationInDays: 365,
		basePrice: 18000,
		maxMembers: 4,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: 'One Month Coaching',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 30,
		basePrice: 4500,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: '15 Days Coaching',
		type: 'summer',
		categoryRequired: false,
		durationInDays: 15,
		basePrice: 3000,
		isRecurring: false,
		isActive: true,
	},
	{
		planName: '15 Days Adult & Ladies Batch',
		type: 'summer',
		categoryRequired: false,
		durationInDays: 15,
		basePrice: 3500,
		isRecurring: false,
		isActive: true,
	},
	{
		planName: 'Special Coaching (Per Month)',
		type: 'monthly',
		categoryRequired: false,
		durationInDays: 30,
		basePrice: 1500,
		isRecurring: true,
		isActive: true,
	},
	{
		planName: 'Exclusive Personal Coaching (Per Session)',
		type: 'public',
		categoryRequired: false,
		durationInMinutes: 60,
		basePrice: 300,
		publicEntryWindow: { startTime: '10:00', endTime: '15:00' },
		isRecurring: false,
		isActive: true,
	},
]

/**
 * Purpose: Do Main
 * Plain English: What this function is used for.
 */
const main = async () => {
    await connectDB()

    const existing = await MembershipPlan.countDocuments()
    const validExisting = await MembershipPlan.countDocuments({
		planName: { $exists: true, $type: 'string', $ne: '' },
		type: { $exists: true, $type: 'string', $ne: '' },
		basePrice: { $exists: true, $type: 'number' },
	})

    // If legacy plans exist (older fields like `name`/`price`), replace them with the official structure.
    if (existing > 0 && validExisting === 0) {
		await MembershipPlan.deleteMany({})
	}

    // Keep historical records but make them inactive; only poster plans are active.
    if (existing > 0 && validExisting > 0) {
		await MembershipPlan.updateMany({}, { $set: { isActive: false } })
	}

    const upserted = []
    for (const plan of officialPlans) {
		const resUpsert = await MembershipPlan.updateOne(
			{ type: plan.type, planName: plan.planName },
			{ $set: plan },
			{ upsert: true }
		)
		upserted.push({ planName: plan.planName, type: plan.type, inserted: Boolean(resUpsert.upsertedId) })
	}

    console.log('✅ Seeded poster plans:', upserted.length)
    for (const row of upserted) {
		console.log(` - ${row.type}: ${row.planName}${row.inserted ? ' (inserted)' : ' (updated)'}`)
	}

    process.exit(0)
};

main().catch(/**
 * Purpose: Promise error handler (runs when async work fails)
 * Plain English: What this function is used for.
 */
e => {
    console.error('❌ Failed to seed poster plans:', e?.message || e)
    process.exit(1)
})
