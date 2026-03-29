/**
 * What it is: API routes for WhatsApp notification management.
 * Non-tech note: Lets admins check WhatsApp status, view QR, see logs, and test messages.
 */

import express from 'express';
import { getStatus, getQRDataURL, sendMessage, disconnectWhatsApp, initWhatsApp } from '../utils/whatsappService.js';
import { checkAndNotify } from '../utils/expiryNotifier.js';
import NotificationLog from '../models/NotificationLog.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// POST /api/whatsapp/connect — Manually start WhatsApp (admin clicks "Connect" button)
router.post('/connect', async (req, res) => {
	try {
		const status = getStatus();
		if (status.status === 'connected') {
			return res.json({ success: true, message: 'WhatsApp is already connected.' });
		}
		if (status.status === 'initializing' || status.status === 'qr_pending') {
			return res.json({ success: true, message: 'WhatsApp is already starting up. Please wait for the QR code.' });
		}
		await initWhatsApp();
		res.json({ success: true, message: 'WhatsApp initialization started. QR code will appear shortly.' });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

// GET /api/whatsapp/status — Check WhatsApp connection status
router.get('/status', (req, res) => {
	const status = getStatus();
	res.json({ success: true, ...status });
});

// GET /api/whatsapp/qr — Get QR code as base64 image (for admin panel)
router.get('/qr', async (req, res) => {
	const status = getStatus();
	if (status.status === 'connected') {
		return res.json({ success: true, status: 'connected', qr: null, message: 'Already connected' });
	}
	const qrDataURL = await getQRDataURL();
	if (!qrDataURL) {
		return res.json({ success: true, status: status.status, qr: null, message: 'QR not available yet. Please wait...' });
	}
	res.json({ success: true, status: 'qr_pending', qr: qrDataURL });
});

// POST /api/whatsapp/test — Send a test message to a specific number
router.post('/test', async (req, res) => {
	const { phone } = req.body;
	if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

	const result = await sendMessage(phone, '✅ Test message from *Kuberalaxmi Sports Academy*!\n\nYour WhatsApp notification system is working correctly. 🏆🎾🏀');
	if (result.success) {
		res.json({ success: true, message: `Test message sent to ${phone}` });
	} else {
		res.status(400).json({ success: false, message: result.error });
	}
});

// POST /api/whatsapp/disconnect — Log out and clear the session (to switch numbers)
router.post('/disconnect', async (req, res) => {
    try {
        await disconnectWhatsApp();
        res.json({ success: true, message: 'WhatsApp disconnected successfully. Scan QR to link a new number.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/whatsapp/time — Get current scheduled notification time
router.get('/time', async (req, res) => {
    try {
        const timeSetting = await Settings.findOne({ key: 'whatsapp_notification_time' });
        // Default to 08:00
        res.json({ success: true, time: timeSetting ? timeSetting.value : '08:00' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/whatsapp/time — Update scheduled notification time
router.post('/time', async (req, res) => {
    try {
        const { time } = req.body;
        if (!time || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
            return res.status(400).json({ success: false, message: 'Invalid time format (HH:mm)' });
        }

        await Settings.findOneAndUpdate(
            { key: 'whatsapp_notification_time' },
            { value: time },
            { upsert: true, new: true }
        );

        // Notify the scheduler to update the cron task
        const { startExpiryNotifier } = await import('../utils/expiryNotifier.js');
        startExpiryNotifier();

        res.json({ success: true, message: `Notification time updated to ${time}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/whatsapp/run-check — Manually trigger the expiry check
router.post('/run-check', async (req, res) => {
	try {
		const results = await checkAndNotify();
		res.json({ success: true, data: results });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

// GET /api/whatsapp/logs — Get recent notification logs
router.get('/logs', async (req, res) => {
	try {
		const { limit = 50, status: statusFilter } = req.query;
		const filter = {};
		if (statusFilter) filter.status = statusFilter;

		const logs = await NotificationLog.find(filter)
			.sort({ sentAt: -1 })
			.limit(Math.min(Number(limit) || 50, 200))
			.lean();

		const counts = {
			total: await NotificationLog.countDocuments(),
			sent: await NotificationLog.countDocuments({ status: 'sent' }),
			failed: await NotificationLog.countDocuments({ status: 'failed' }),
		};

		res.json({ success: true, data: logs, counts });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

// DELETE /api/whatsapp/logs — Clear all notification history
router.delete('/logs', async (req, res) => {
	try {
		const result = await NotificationLog.deleteMany({});
		res.json({ success: true, message: `Cleared ${result.deletedCount} notification log(s).` });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

export default router;
