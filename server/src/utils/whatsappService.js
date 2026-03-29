/**
 * What it is: WhatsApp Web client service.
 * Non-tech note: Connects to WhatsApp via QR scan, then sends messages automatically.
 */

import pkg from 'whatsapp-web.js';
const { Client, RemoteAuth } = pkg;
import qrcode from 'qrcode-terminal';
import qrcodeImg from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import wwebjsMongo from 'wwebjs-mongo';
const { MongoStore } = wwebjsMongo;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let client = null;
let currentStatus = 'initializing'; // 'initializing' | 'disconnected' | 'qr_pending' | 'connected'
let currentQR = null;
let connectedPhone = null;

/**
 * Initialize the WhatsApp client.
 * Call this once when the server starts.
 */
export const initWhatsApp = async () => {
	try {
		// Wait for MongoDB to be connected before initializing the session store
		console.log('⏳ Waiting for database connection before starting WhatsApp...');
		let dbRetries = 0;
		while (mongoose.connection.readyState !== 1 && dbRetries < 20) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			dbRetries++;
		}
		if (mongoose.connection.readyState !== 1) {
			console.error('❌ Database connection timed out. WhatsApp will run without session persistence!');
		}
		// Build a list of candidate Chrome paths to check
		const chromePaths = [
			// 1. Explicit env override (set this in Render environment variables)
			process.env.CHROMIUM_PATH,
			// 2. Project-local puppeteer cache (set PUPPETEER_CACHE_DIR to this path in Render)
			//    Render project lives at /opt/render/project/src/
			...(() => {
				const cacheDir = process.env.PUPPETEER_CACHE_DIR
					|| path.join(__dirname, '../../../.puppeteer_cache');
				// Scan for the chrome binary inside the versioned subfolder
				try {
					if (fs.existsSync(cacheDir)) {
						const found = [];
						const scan = (dir, depth = 0) => {
							if (depth > 5) return;
							for (const entry of fs.readdirSync(dir)) {
								const full = path.join(dir, entry);
								if (entry === 'chrome' && fs.statSync(full).isFile()) found.push(full);
								else if (fs.statSync(full).isDirectory()) scan(full, depth + 1);
							}
						};
						scan(cacheDir);
						return found;
					}
				} catch (_) {}
				return [];
			})(),
			// 3. Common system paths on Linux cloud servers
			'/usr/bin/google-chrome-stable',
			'/usr/bin/google-chrome',
			'/usr/bin/chromium-browser',
			'/usr/bin/chromium',
			'/snap/bin/chromium',
		];

		const foundChrome = chromePaths.find(p => p && fs.existsSync(p));
		const puppeteerConfig = {
			headless: true,
			...(foundChrome && { executablePath: foundChrome }),
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--no-first-run',
				'--disable-gpu',
				'--disable-software-rasterizer',
				'--disable-extensions',
				'--disable-background-networking',
				'--disable-default-apps',
				'--disable-sync',
				'--hide-scrollbars',
				'--mute-audio',
				'--safebrowsing-disable-auto-update',
				'--disable-background-timer-throttling',
				'--disable-renderer-backgrounding',
				'--disable-features=IsolateOrigins,site-per-process,DialMediaRouteProvider'
			],
		};
		console.log(`🔍 Chrome path: ${foundChrome || 'puppeteer bundled (auto)'}`);

		// Use MongoDB to persist WhatsApp session
		const store = new MongoStore({ mongoose: mongoose });

		client = new Client({
			authStrategy: new RemoteAuth({
				store: store,
				backupSyncIntervalMs: 300000, // Save session every 5 mins
				clientId: 'bluefins-prod',
				dataPath: path.join(__dirname, '../../.wwebjs_auth')
			}),
			puppeteer: puppeteerConfig,
		});

		// Hack to fix whatsapp-web.js RemoteAuth bug where it crashes looking for 'Default'
		// It expects Puppeteer to create a /Default folder, which newer versions skip sometimes.
		setInterval(() => {
			try {
				const defaultPath = path.join(__dirname, '../../.wwebjs_auth/wwebjs_temp_session_bluefins-prod/Default');
				if (!fs.existsSync(defaultPath)) {
					fs.mkdirSync(defaultPath, { recursive: true });
				}
			} catch (err) {}
		}, 10000);

		client.on('qr', (qr) => {
			currentStatus = 'qr_pending';
			currentQR = qr;
			console.log('\n📱 WhatsApp QR Code — Scan this with your phone:');
			qrcode.generate(qr, { small: true });
			console.log('Or visit /api/whatsapp/qr in your admin panel.\n');
		});

		client.on('ready', () => {
			currentStatus = 'connected';
			currentQR = null;
			const info = client.info;
			connectedPhone = info?.wid?.user || 'unknown';
			console.log(`\n✅ WhatsApp connected! Logged in as: ${connectedPhone}\n`);
		});

		client.on('authenticated', () => {
			console.log('🔐 WhatsApp session authenticated.');
		});

		client.on('remote_session_saved', () => {
			console.log('💾 WhatsApp session securely saved to MongoDB (will survive server restarts).');
		});

		client.on('auth_failure', (msg) => {
			currentStatus = 'disconnected';
			currentQR = null;
			console.error('❌ WhatsApp auth failed:', msg);
		});

		client.on('disconnected', (reason) => {
			currentStatus = 'disconnected';
			currentQR = null;
			connectedPhone = null;
			console.log('⚠️ WhatsApp disconnected:', reason);
			// Attempt to reconnect after 30 seconds
			setTimeout(() => {
				console.log('🔄 Attempting to reconnect WhatsApp...');
				client.initialize().catch(err => {
					console.error('❌ WhatsApp reconnect failed:', err.message);
				});
			}, 30000);
		});

		client.initialize().catch(err => {
			console.error('❌ WhatsApp initialization error:', err.message);
			currentStatus = 'disconnected';
		});

		currentStatus = 'initializing';
		console.log('📱 WhatsApp client initializing... waiting for QR or auto-reconnect (this can take 30-60 seconds with Cloud sessions).');
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
 * Returns: "919876543210@c.us"
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
	return cleaned + '@c.us';
};

/**
 * Send a WhatsApp message to a phone number.
 * @param {string} phone - The recipient's phone number
 * @param {string} message - The message text
 * @returns {{ success: boolean, error?: string }}
 */
export const sendMessage = async (phone, message) => {
	if (currentStatus !== 'connected' || !client) {
		return { success: false, error: 'WhatsApp is not connected' };
	}

	const chatId = formatPhone(phone);
	if (!chatId) {
		return { success: false, error: 'Invalid phone number' };
	}

	let lastError = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			// Check if the number is registered on WhatsApp
			const isRegistered = await client.isRegisteredUser(chatId);
			if (!isRegistered) {
				return { success: false, error: `${phone} is not registered on WhatsApp` };
			}

			await client.sendMessage(chatId, message);
			return { success: true };
		} catch (err) {
			lastError = err.message;
			// If it's a critical Puppeteer error like Detached Frame, wait and retry
			if (err.message.includes('detached Frame') || err.message.includes('Target closed') || err.message.includes('Execution context was destroyed')) {
				console.log(`⚠️ Frame detached or closed. Retrying send to ${phone} (Attempt ${attempt}/3)...`);
				await new Promise(res => setTimeout(res, 2500)); // Wait 2.5s before retry
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
	if (client) {
		try {
			await client.logout();
			await client.destroy();
		} catch (err) {
			console.error('Error disconnecting WhatsApp:', err.message);
		}
	}
	currentStatus = 'disconnected';
	currentQR = null;
	connectedPhone = null;
};
