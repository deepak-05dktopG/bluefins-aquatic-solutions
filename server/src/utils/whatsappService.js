/**
 * What it is: WhatsApp client service using Baileys (no Chrome needed!).
 * Non-tech note: Connects to WhatsApp via QR scan, then sends messages automatically.
 *               Uses direct WebSocket connection — no browser, minimal RAM usage.
 */

import { default as makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import qrcodeImg from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Silent logger for production (Baileys is very verbose by default)
const logger = pino({ level: 'silent' });

let sock = null;
let currentStatus = 'initializing'; // 'initializing' | 'disconnected' | 'qr_pending' | 'connected'
let currentQR = null;
let connectedPhone = null;
let retryCount = 0;
const MAX_RETRIES = 5;

// Auth state directory
const AUTH_DIR = path.join(__dirname, '../../.wwebjs_auth/baileys_auth');

/**
 * Initialize the WhatsApp client.
 * Call this once when the server starts.
 */
export const initWhatsApp = async () => {
	try {
		console.log('⏳ Starting WhatsApp client initialization (Baileys - no Chrome needed!)...');

		// Ensure auth directory exists
		if (!fs.existsSync(AUTH_DIR)) {
			fs.mkdirSync(AUTH_DIR, { recursive: true });
		}

		// Load saved session (if any)
		const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

		// Get the latest WhatsApp Web version
		const { version } = await fetchLatestBaileysVersion();
		console.log(`📱 Using WhatsApp Web version: ${version.join('.')}`);

		// Create the socket connection (ultra low-memory config for 512MB servers)
		sock = makeWASocket({
			version,
			auth: {
				creds: state.creds,
				keys: state.keys, // Use raw keys — no in-memory caching of signal sessions
			},
			printQRInTerminal: false, // We handle QR ourselves
			logger,
			browser: ['BlueFins Academy', 'Chrome', '120.0.0'],
			generateHighQualityLinkPreview: false,
			syncFullHistory: false, // Don't sync old messages
			markOnlineOnConnect: false, // Don't mark as online
			shouldSyncHistoryMessage: () => false, // Block ALL history sync to save RAM
			getMessage: async () => ({ conversation: '' }), // Don't retry/cache failed messages
		});

		// Handle connection updates (QR, connected, disconnected)
		sock.ev.on('connection.update', async (update) => {
			const { connection, lastDisconnect, qr } = update;

			if (qr) {
				// New QR code received — display it
				currentStatus = 'qr_pending';
				currentQR = qr;
				retryCount = 0;
				console.log('\n📱 WhatsApp QR Code — Scan this with your phone:');
				qrcodeTerminal.generate(qr, { small: true });
				console.log('Or visit /api/whatsapp/qr in your admin panel.\n');
			}

			if (connection === 'close') {
				currentQR = null;
				const statusCode = lastDisconnect?.error?.output?.statusCode;
				const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

				if (statusCode === DisconnectReason.loggedOut) {
					// User explicitly logged out — clear session
					console.log('🚪 WhatsApp logged out. Clearing session...');
					currentStatus = 'disconnected';
					connectedPhone = null;
					// Clear auth files so a fresh QR appears next time
					try {
						fs.rmSync(AUTH_DIR, { recursive: true, force: true });
						fs.mkdirSync(AUTH_DIR, { recursive: true });
					} catch (_) {}
				} else if (shouldReconnect && retryCount < MAX_RETRIES) {
					// Connection lost — auto-reconnect
					retryCount++;
					const delay = Math.min(retryCount * 2000, 10000);
					console.log(`⚠️ WhatsApp disconnected (code: ${statusCode}). Reconnecting in ${delay / 1000}s... (Attempt ${retryCount}/${MAX_RETRIES})`);
					currentStatus = 'disconnected';
					connectedPhone = null;
					// IMPORTANT: Destroy old socket BEFORE creating new one to prevent memory leak
					try {
						sock.ev.removeAllListeners();
						sock.ws.close();
					} catch (_) {}
					sock = null;
					setTimeout(() => initWhatsApp(), delay);
				} else {
					console.error('❌ WhatsApp connection failed permanently. Please restart the server.');
					currentStatus = 'disconnected';
					connectedPhone = null;
				}
			}

			if (connection === 'open') {
				// Successfully connected!
				currentStatus = 'connected';
				currentQR = null;
				retryCount = 0;

				// Extract the connected phone number
				const user = sock.user;
				connectedPhone = user?.id?.split(':')[0] || user?.id?.split('@')[0] || 'unknown';
				console.log(`\n✅ WhatsApp connected! Logged in as: ${connectedPhone}\n`);
			}
		});

		// Save credentials whenever they update (keeps session alive)
		sock.ev.on('creds.update', saveCreds);

		currentStatus = 'initializing';
		console.log('📱 WhatsApp client initializing... waiting for QR or auto-reconnect.');
	} catch (err) {
		console.error('❌ Failed to create WhatsApp client:', err.message);
		currentStatus = 'disconnected';
	}
};

/**
 * Get the current WhatsApp connection status.
 */
export const getStatus = () => ({
	status: currentStatus,
	phone: connectedPhone,
});

/**
 * Get the current QR code as a base64 data URL (for admin panel display).
 * Returns null if no QR is pending.
 */
export const getQRDataURL = async () => {
	if (!currentQR) return null;
	try {
		return await qrcodeImg.toDataURL(currentQR);
	} catch {
		return null;
	}
};

/**
 * Format a phone number for WhatsApp API.
 * Accepts: "9876543210", "+919876543210", "919876543210"
 * Returns: "919876543210@s.whatsapp.net"
 */
const formatPhone = (phone) => {
	if (!phone) return null;
	let cleaned = String(phone).replace(/[\s\-\+\(\)]/g, '');
	// If 10 digits, assume Indian number
	if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
		cleaned = '91' + cleaned;
	}
	// Remove leading + if present
	if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
	return cleaned + '@s.whatsapp.net';
};

/**
 * Send a WhatsApp message to a phone number.
 * @param {string} phone - The recipient's phone number
 * @param {string} message - The message text
 * @returns {{ success: boolean, error?: string }}
 */
export const sendMessage = async (phone, message) => {
	if (currentStatus !== 'connected' || !sock) {
		return { success: false, error: 'WhatsApp is not connected' };
	}

	const jid = formatPhone(phone);
	if (!jid) {
		return { success: false, error: 'Invalid phone number' };
	}

	let lastError = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			// Check if number exists on WhatsApp
			const [result] = await sock.onWhatsApp(jid.replace('@s.whatsapp.net', ''));
			if (!result?.exists) {
				return { success: false, error: `${phone} is not registered on WhatsApp` };
			}

			await sock.sendMessage(result.jid, { text: message });
			return { success: true };
		} catch (err) {
			lastError = err.message;
			if (attempt < 3) {
				console.log(`⚠️ Send failed to ${phone}. Retrying (Attempt ${attempt}/3)...`);
				await new Promise(res => setTimeout(res, 2000));
				continue;
			}
			return { success: false, error: err.message };
		}
	}

	return { success: false, error: `Failed after 3 attempts. Last error: ${lastError}` };
};

/**
 * Disconnect and destroy the WhatsApp session.
 * Use this if you want to switch to a different number.
 */
export const disconnectWhatsApp = async () => {
	if (sock) {
		try {
			await sock.logout();
		} catch (err) {
			console.error('Error disconnecting WhatsApp:', err.message);
		}
	}
	currentStatus = 'disconnected';
	currentQR = null;
	connectedPhone = null;
	// Clear auth directory for fresh QR on next connect
	try {
		fs.rmSync(AUTH_DIR, { recursive: true, force: true });
		fs.mkdirSync(AUTH_DIR, { recursive: true });
	} catch (_) {}
};
