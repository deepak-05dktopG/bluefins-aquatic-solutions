/**
 * What it is: CRUD controller for managing membership plans.
 * Non-tech note: Lets the admin create, edit, activate/deactivate, and delete plans from the UI.
 */

import asyncHandler from 'express-async-handler';
import MembershipPlan from '../models/MembershipPlan.js';
import Member from '../models/Member.js';

/**
 * GET /api/admin/plans — List ALL plans (active + inactive) for admin management.
 */
export const adminListPlans = asyncHandler(async (req, res) => {
	const plans = await MembershipPlan.find({}).sort({ isActive: -1, type: 1, basePrice: 1 }).lean();

	// Count members per plan for the admin UI
	const plansWithCounts = await Promise.all(
		plans.map(async (plan) => {
			const memberCount = await Member.countDocuments({ planId: plan._id });
			return { ...plan, memberCount };
		})
	);

	res.json({ success: true, data: plansWithCounts });
});

/**
 * POST /api/admin/plans — Create a new membership plan.
 */
export const createPlan = asyncHandler(async (req, res) => {
	const { planName, type, durationInDays, durationInMinutes, basePrice, originalPrice, maxMembers, isRecurring, isActive, categoryRequired, publicEntryWindow } = req.body;

	if (!planName || !type || basePrice == null) {
		return res.status(400).json({ success: false, message: 'Plan name, type, and base price are required.' });
	}

	// Check for duplicate name
	const existing = await MembershipPlan.findOne({ planName: planName.trim() });
	if (existing) {
		return res.status(400).json({ success: false, message: `A plan named "${planName}" already exists.` });
	}

	const plan = await MembershipPlan.create({
		planName: planName.trim(),
		type,
		durationInDays: durationInDays || undefined,
		durationInMinutes: durationInMinutes || undefined,
		basePrice,
		originalPrice: originalPrice || undefined,
		maxMembers: maxMembers || undefined,
		isRecurring: isRecurring ?? false,
		isActive: isActive ?? true,
		categoryRequired: categoryRequired ?? false,
		publicEntryWindow: publicEntryWindow || undefined,
	});

	res.status(201).json({ success: true, data: plan, message: `Plan "${plan.planName}" created successfully.` });
});

/**
 * PATCH /api/admin/plans/:id — Update an existing plan.
 */
export const updatePlan = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const updates = req.body;

	const plan = await MembershipPlan.findById(id);
	if (!plan) {
		return res.status(404).json({ success: false, message: 'Plan not found.' });
	}

	// If renaming, check for duplicate
	if (updates.planName && updates.planName.trim() !== plan.planName) {
		const duplicate = await MembershipPlan.findOne({ planName: updates.planName.trim(), _id: { $ne: id } });
		if (duplicate) {
			return res.status(400).json({ success: false, message: `A plan named "${updates.planName}" already exists.` });
		}
	}

	// Apply allowed updates
	const allowedFields = ['planName', 'type', 'durationInDays', 'durationInMinutes', 'basePrice', 'originalPrice', 'maxMembers', 'isRecurring', 'isActive', 'categoryRequired', 'publicEntryWindow'];
	for (const field of allowedFields) {
		if (updates[field] !== undefined) {
			plan[field] = updates[field];
		}
	}

	await plan.save();
	res.json({ success: true, data: plan, message: `Plan "${plan.planName}" updated successfully.` });
});

/**
 * DELETE /api/admin/plans/:id — Delete a plan (only if no members are enrolled).
 */
export const deletePlan = asyncHandler(async (req, res) => {
	const { id } = req.params;

	const plan = await MembershipPlan.findById(id);
	if (!plan) {
		return res.status(404).json({ success: false, message: 'Plan not found.' });
	}

	// Safety check: don't delete if members are using this plan
	const memberCount = await Member.countDocuments({ planId: id });
	if (memberCount > 0) {
		return res.status(400).json({
			success: false,
			message: `Cannot delete "${plan.planName}" — ${memberCount} member(s) are enrolled on this plan. Deactivate it instead.`,
		});
	}

	await MembershipPlan.findByIdAndDelete(id);
	res.json({ success: true, message: `Plan "${plan.planName}" deleted successfully.` });
});
