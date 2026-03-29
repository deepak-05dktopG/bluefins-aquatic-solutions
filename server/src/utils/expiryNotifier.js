/**
 * What it is: Automated membership expiry notification scheduler.
 * Non-tech note: Runs every day at 8 AM IST, finds expiring members, sends WhatsApp reminders.
 */

import cron from 'node-cron';
import mongoose from 'mongoose';
import Member from '../models/Member.js';
import NotificationLog from '../models/NotificationLog.js';
import Settings from '../models/Settings.js';
import { sendMessage, getStatus } from './whatsappService.js';

let activeCronJob = null;

/**
 * Build a personalized reminder message.
 */
const buildMessage = (name, daysLeft, expiryDateStr) => {
	const firstName = name?.split(' ')[0] || 'Dear Member';

	if (daysLeft === 7) {
		return `🌟 *KUBERALAXMI SPORTS ACADEMY* 🌟\n\nHello *${firstName}*! 👋\n\nYour swimming membership is expiring in *7 days* (on ${expiryDateStr}). 📅\n\nDon't let your progress stop! 🏃‍♂️💨 Renew now to keep your access active and continue your training! 💪✨\n\n📞 For renewals, contact us today!\n— *Kuberalaxmi Sports Academy*`;
	}
	if (daysLeft === 3) {
		return `⏰ *KUBERALAXMI SPORTS ACADEMY* ⏰\n\nHi *${firstName}*! ✨\n\nJust *3 days remaining* on your membership (expires on ${expiryDateStr}). ⏳\n\nYour sessions are waiting for you! 🏅 Please renew soon to avoid any interruption in your training. ⚡🧗‍♂️\n\n📞 Need help? Contact us now!\n— *Kuberalaxmi Sports Academy*`;
	}
	if (daysLeft === 1) {
		return `🚨 *KUBERALAXMI SPORTS ACADEMY* 🚨\n\nUrgent: *${firstName}*! ⚡\n\nYour membership expires *TOMORROW*! (${expiryDateStr}) 😱🔥\n\nRenew today to keep your spot and continue your journey with us without any break! 🏆🎾🏀\n\n📞 Contact us immediately for a quick renewal!\n— *Kuberalaxmi Sports Academy*`;
	}
	return `Hi ${firstName}, your membership at *Kuberalaxmi Sports Academy* is expiring soon. 📅 Please contact us to renew and continue your training! 💪✨`;
};

/**
 * Format a Date to a readable Indian date string.
 */
const formatDate = (date) => {
	return new Date(date).toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: 'Asia/Kolkata',
	});
};

/**
 * Get the UTC date range for a given day offset in IST.
 * Since expiryDates are stored as YYYY-MM-DDT23:59:59.999Z (end of UTC day),
 * we simply find today's IST date, add N days, and query that UTC calendar date.
 */
const getDateRange = (daysFromNow) => {
	// Step 1: Get today's date as seen in IST (e.g. "2026-04-05")
	const todayIST = new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Kolkata',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date()); // returns "YYYY-MM-DD"

	// Step 2: Parse and add the offset days
	const [year, month, day] = todayIST.split('-').map(Number);
	const targetDate = new Date(Date.UTC(year, month - 1, day + daysFromNow));

	// Step 3: Build full-day UTC range for that calendar date
	// (Expiry dates stored as YYYY-MM-DDT23:59:59.999Z — same UTC calendar date)
	const startUTC = new Date(Date.UTC(
		targetDate.getUTCFullYear(),
		targetDate.getUTCMonth(),
		targetDate.getUTCDate(),
		0, 0, 0, 0
	));
	const endUTC = new Date(Date.UTC(
		targetDate.getUTCFullYear(),
		targetDate.getUTCMonth(),
		targetDate.getUTCDate(),
		23, 59, 59, 999
	));

	return { start: startUTC, end: endUTC };
};

/**
 * Check for expiring members and send WhatsApp reminders.
 * This is the main function called by the cron job.
 */
export const checkAndNotify = async () => {
	const whatsappStatus = getStatus();
	if (whatsappStatus.status !== 'connected') {
		console.log('⚠️ [ExpiryNotifier] WhatsApp not connected. Skipping notifications.');
		return { skipped: true, reason: 'WhatsApp not connected' };
	}

	console.log('\n🔍 [ExpiryNotifier] Running expiry check...');
	const results = { sent: 0, failed: 0, skipped: 0, errors: [] };

	// Check for 7-day, 3-day, and 1-day expiry windows
	const checks = [
		{ days: 7, reminderField: 'reminderSent7' },
		{ days: 3, reminderField: 'reminderSent3' },
		{ days: 1, reminderField: 'reminderSent1' },
	];

	for (const check of checks) {
		const { start, end } = getDateRange(check.days);

		// DEBUG: Print the exact search window being used
		console.log(`\n📅 [DEBUG] Checking ${check.days}-day window:`);
		console.log(`   Search UTC: ${start.toISOString()} → ${end.toISOString()}`);

		// Also do a raw count with NO filters to see what's in the DB for that window
		const allInWindow = await Member.find({ expiryDate: { $gte: start, $lte: end } }).select('name status phone expiryDate reminderSent7 reminderSent3 reminderSent1');
		console.log(`   Members with expiry in this window (no filters): ${allInWindow.length}`);
		allInWindow.forEach(m => {
			console.log(`     → ${m.name} | status:${m.status} | phone:${m.phone} | expiry:${m.expiryDate?.toISOString()} | r7:${m.reminderSent7}`);
		});

		// Find any member (Active or Expiring) who hasn't been reminded yet
		const members = await Member.find({
			status: { $ne: 'expired' },        // Includes 'active' and 'expiring'
			expiryDate: { $gte: start, $lte: end },
			[check.reminderField]: { $ne: true },
			phone: { $exists: true, $ne: '' },
		});
		console.log(`   After all filters: ${members.length} members to notify`);

		if (members.length === 0) continue;

		console.log(`📋 [ExpiryNotifier] Found ${members.length} members for ${check.days}-day reminder`);

		for (const member of members) {
			// Skip if already logged for this specific day/expiry combo
			const alreadyLogged = await NotificationLog.findOne({
				memberId: member._id,
				expiryDate: member.expiryDate,
				daysBeforeExpiry: check.days,
				status: 'sent',
			});

			if (alreadyLogged) {
                // Keep flags in sync
				if (!member[check.reminderField]) {
                    member[check.reminderField] = true;
                    await member.save();
                }
				continue;
			}

			// Build and send the message
			const expiryStr = formatDate(member.expiryDate);
			const message = buildMessage(member.name, check.days, expiryStr);
			const sendResult = await sendMessage(member.phone, message);

			// Log the notification
			try {
				await NotificationLog.create({
					memberId: member._id,
					memberName: member.name,
					phone: member.phone,
					daysBeforeExpiry: check.days,
					expiryDate: member.expiryDate,
					message,
					status: sendResult.success ? 'sent' : 'failed',
					error: sendResult.error || undefined,
				});
			} catch (logErr) {
				// Duplicate key = already logged, that's fine
				if (logErr.code !== 11000) {
					console.error('Error logging notification:', logErr.message);
				}
			}

			if (sendResult.success) {
				// Mark reminder as sent on the member document
				member[check.reminderField] = true;
				await member.save();
				results.sent++;
				console.log(`  ✅ Sent ${check.days}-day reminder to ${member.name} (${member.phone})`);
			} else {
				results.failed++;
				results.errors.push({
					member: member.name,
					phone: member.phone,
					error: sendResult.error,
				});
				console.log(`  ❌ Failed to send to ${member.name}: ${sendResult.error}`);
			}

			// Wait 3 seconds between messages to avoid spam detection
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}
	}

	console.log(
		`\n📊 [ExpiryNotifier] Done! Sent: ${results.sent}, Failed: ${results.failed}, Skipped: ${results.skipped}\n`
	);
	return results;
};

/**
 * Start or update the cron scheduler.
 * Reads time from database (Settings) or defaults to 8:00 AM IST.
 */
export const startExpiryNotifier = async () => {
    try {
        // Stop the previous job if it exists (allows dynamic updates)
        if (activeCronJob) {
            activeCronJob.stop();
            console.log('🔄 [ExpiryNotifier] Stopping previous cron job to update schedule...');
        }

        // Wait up to 15s for MongoDB to be connected before querying Settings
        let waited = 0;
        while (mongoose.connection.readyState !== 1 && waited < 15000) {
            await new Promise(r => setTimeout(r, 500));
            waited += 500;
        }

        let time = '08:00'; // Safe default
        if (mongoose.connection.readyState === 1) {
            try {
                const timeSetting = await Settings.findOne({ key: 'whatsapp_notification_time' });
                if (timeSetting?.value) time = timeSetting.value;
            } catch (e) {
                console.log('⚠️ [ExpiryNotifier] Could not read time setting, using default 08:00');
            }
        } else {
            console.log('⚠️ [ExpiryNotifier] DB not ready, using default time 08:00 IST');
        }

        const [hour, minute] = time.split(':');
        const cronExpr = `${minute} ${hour} * * *`;

        activeCronJob = cron.schedule(cronExpr, async () => {
            console.log(`\n⏰ [CRON] ${time} IST — Starting expiry notification check...`);
            try {
                await checkAndNotify();
            } catch (err) {
                console.error('❌ [CRON] Expiry notification error:', err.message);
            }
        }, {
            timezone: 'Asia/Kolkata',
            scheduled: true,
        });

        console.log(`📅 Expiry notification cron job scheduled (daily at ${time} IST)`);
    } catch (err) {
        console.error('❌ [ExpiryNotifier] Failed to start cron job:', err.message);
    }
};
