/**
 * What it is: Admin panel page (Attendance scan screen).
 * Non-tech note: Uses the camera to scan a QR code and mark attendance.
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { adminFetch, isAdminAuthenticated, clearAdminToken } from '../../utils/adminAuth'
import { formatTime } from '../../utils/dateTime'
import { FaCamera, FaSyncAlt, FaStopCircle, FaKeyboard } from 'react-icons/fa'

// Read the response body safely and parse JSON (falls back to plain-text error message)
const safeReadJson = async res => {
    const text = await res.text()
    if (!text) return { ok: false, message: 'Empty response from server' }
    try {
		return JSON.parse(text)
	} catch {
		return { ok: false, message: text }
	}
};

// Helper to play distinct sounds based on scan results using Web Audio API
const playAudioFeedback = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        switch (type) {
            case 'success':
                // Happy chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
                break;
            case 'warning':
                // Double beep
                osc.type = 'square';
                osc.frequency.value = 400;
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime); // Beep 1
                gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.2); // Beep 2
                gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
                break;
            case 'error':
                // Low buzz
                osc.type = 'sawtooth';
                osc.frequency.value = 150;
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.4);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.5);
                break;
        }
    } catch {
        // Ignore errors (user hasn't interacted, etc.)
    }
};

export default /* Attendance scanner — scan member QR (or manual ID) to record daily check-in */
function AttendanceScan() {
    const navigate = useNavigate()
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

    const videoRef = React.useRef(null)
    const canvasRef = React.useRef(null)
    const streamRef = React.useRef(null)
    const scanTimerRef = React.useRef(null)
    const zxingControlsRef = React.useRef(null)
    const lastSeenRef = React.useRef({ value: '', at: 0 })
    const detectingRef = React.useRef(false)
    const lastRequestedDeviceIdRef = React.useRef(null)

    const [videoInputs, setVideoInputs] = React.useState([])
    const [activeDeviceId, setActiveDeviceId] = React.useState('')
    const [enumeratedOnce, setEnumeratedOnce] = React.useState(false)

	const listVideoInputs = React.useCallback(
	// List available camera devices so admin can switch between them
    async () => {
        if (!navigator.mediaDevices?.enumerateDevices) return []
        const all = await navigator.mediaDevices.enumerateDevices()
		return (all || []).filter(
		// Keep only camera devices (ignore microphones/speakers)
        d => {
            return d && d.kind === 'videoinput';
        });
    }, [])

		const getEnhancedCameraConstraints = React.useCallback(
		// Build camera constraints (prefer selected deviceId + HD settings when available)
        ({ deviceId } = {}) => {
            const requestedDeviceId = deviceId || activeDeviceId || lastRequestedDeviceIdRef.current
            if (requestedDeviceId) {
				return {
					video: {
						deviceId: { exact: requestedDeviceId },
						width: { ideal: 1920 },
						height: { ideal: 1080 },
						frameRate: { ideal: 30, max: 60 },
					},
					audio: false,
				}
			}
            return {
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					frameRate: { ideal: 30, max: 60 },
				},
				audio: false,
			}
        },
		[activeDeviceId]
	)

	const applyBestEffortVideoTrackConstraints = React.useCallback(
	// Best-effort tuning for sharper QR scans (continuous focus/exposure/white balance/zoom)
    async stream => {
        try {
			const track = stream?.getVideoTracks?.()?.[0]
			if (!track?.applyConstraints) return
			const caps = track.getCapabilities?.() || {}
			const advanced = []

			if (Array.isArray(caps.focusMode) && caps.focusMode.length > 0) {
				advanced.push({ focusMode: caps.focusMode.includes('continuous') ? 'continuous' : caps.focusMode[0] })
			}
			if (Array.isArray(caps.exposureMode) && caps.exposureMode.length > 0) {
				advanced.push({ exposureMode: caps.exposureMode.includes('continuous') ? 'continuous' : caps.exposureMode[0] })
			}
			if (Array.isArray(caps.whiteBalanceMode) && caps.whiteBalanceMode.length > 0) {
				advanced.push({ whiteBalanceMode: caps.whiteBalanceMode.includes('continuous') ? 'continuous' : caps.whiteBalanceMode[0] })
			}
			if (caps.zoom && typeof caps.zoom === 'object' && typeof caps.zoom.max === 'number') {
				const targetZoom = Math.min(2.5, caps.zoom.max)
				if (Number.isFinite(targetZoom) && targetZoom > 1) advanced.push({ zoom: targetZoom })
			}

			if (advanced.length > 0) {
				await track.applyConstraints({ advanced })
			}
		} catch {
			// best-effort; ignore unsupported constraint errors
		}
    }, [])

    const [starting, setStarting] = React.useState(false)
    const [scanning, setScanning] = React.useState(false)
    const [flipPreviewX, setFlipPreviewX] = React.useState(false)
    const [manualPayload, setManualPayload] = React.useState('')
    const [lastScan, setLastScan] = React.useState(null)
    const [cameraError, setCameraError] = React.useState('')

	const isUserFacingTrack = React.useCallback(
	// Detect whether active camera is front-facing (used to mirror preview if needed)
    track => {
        try {
			const settings = track?.getSettings?.() || {}
			if (typeof settings.facingMode === 'string') return settings.facingMode === 'user'
			const label = String(track?.label || '')
			if (/front|user/i.test(label)) return true
			if (/back|rear|environment/i.test(label)) return false
		} catch {
			// ignore
		}
        return false
    }, [])

	const showPopup = React.useCallback(
	// Centralized SweetAlert popup helper for scan success/errors/duplicate warnings
    async ({ icon, title, text, ms = 2200 }) => {
        await Swal.fire({
			icon,
			title,
			text,
			position: 'center',
			showConfirmButton: false,
			timer: ms,
			timerProgressBar: true,
			allowOutsideClick: true,
			allowEscapeKey: true,
			// Pause auto-close timer while user hovers the popup (so they can read it)
            didOpen: popup => {
                popup.addEventListener('mouseenter', Swal.stopTimer)
                popup.addEventListener('mouseleave', Swal.resumeTimer)
            },
		})
    }, [])

	React.useEffect(
	// Guard: if admin session is missing, redirect back to admin login
    () => {
        if (!isAdminAuthenticated()) navigate('/admin')
    }, [navigate])

    // Security: auto-logout when the browser tab/window is closed or refreshed
    React.useEffect(() => {
        const handleBeforeUnload = () => clearAdminToken()
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [])

	const stopCamera = React.useCallback(
	// Stop QR scanning loop, ZXing controls, and camera stream tracks
    () => {
        if (zxingControlsRef.current) {
			try {
				zxingControlsRef.current.stop()
			} catch {
				// ignore
			}
			zxingControlsRef.current = null
		}

        if (scanTimerRef.current) {
			window.clearInterval(scanTimerRef.current)
			scanTimerRef.current = null
		}

        const stream = streamRef.current
        if (stream) {
			for (const track of stream.getTracks()) track.stop()
		}
        streamRef.current = null
        setScanning(false)
        setFlipPreviewX(false)
    }, [])

	React.useEffect(
	// Cleanup: ensure camera and timers are stopped when leaving this page
    () => {
        return (
			// Effect cleanup function
            () => {
                return stopCamera();
            }
        );
    }, [stopCamera])

		const submitPayload = React.useCallback(
		// Send scanned QR / manual member ID to server to record attendance
        async (payload, method) => {
            const trimmed = payload == null ? '' : String(payload).trim()
            if (!trimmed) return

            try {
				const res = await adminFetch(`${apiBase}/attendance/scan`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ payload: trimmed, method }),
				})
				const parsed = await safeReadJson(res)
				if (!res.ok || parsed?.success === false) throw new Error(parsed?.message || `Failed (${res.status})`)

				const attendance = parsed?.data?.attendance
				const member = parsed?.data?.member
				const duplicate = Boolean(parsed?.meta?.duplicate)
				const duplicateWindowSeconds = Number(parsed?.meta?.duplicateWindowSeconds) || 30
				const duplicateType = parsed?.meta?.duplicateType
				setLastScan({ attendance, member, duplicate })

				if (duplicate) {
					playAudioFeedback('warning')
					if (duplicateType === 'day') {
						void showPopup({
							icon: 'info',
							title: 'Already checked in today',
							text: `${member?.name || 'This member'} is already marked present for today. If you need to correct it, use Attendance Records.`,
							ms: 3000,
						})
					} else {
						void showPopup({
							icon: 'info',
							title: 'Please wait',
							text: `${member?.name || 'This member'} was checked in just now. Please wait ${duplicateWindowSeconds} seconds and try again.`,
							ms: 2600,
						})
					}
					return
				}

				if (attendance?.result === 'rejected') {
					playAudioFeedback('error')
					void showPopup({
						icon: 'warning',
						title: 'Entry not allowed',
						text: attendance?.reason || 'This membership is not active.',
						ms: 3200,
					})
					return
				}

				playAudioFeedback('success')
				void showPopup({
					icon: 'success',
					title: 'Checked in successfully',
					text: `${member?.name || 'Member'} attendance has been recorded.`,
					ms: 2000,
				})
			} catch (e) {
				playAudioFeedback('error')
				setLastScan({ error: e?.message || 'Scan failed' })
				void showPopup({
					icon: 'error',
					title: 'Scan failed',
					text: e?.message || 'Unable to record attendance. Please try again.',
					ms: 3200,
				})
			}
        },
		[apiBase, showPopup]
	)

	const startCamera = React.useCallback(
	// Request camera permission, start preview, and start QR detection loop
    async ({ deviceId } = {}) => {
        setCameraError('')
        setStarting(true)
        try {
			if (!window.isSecureContext && window.location.hostname !== 'localhost') {
				throw new Error('Camera requires HTTPS (or localhost). Open the site using https:// or use a secure tunnel (ngrok/Cloudflare).')
			}
			if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera not supported in this browser')
			stopCamera()

			const video = videoRef.current
			if (!video) throw new Error('Video element not ready')

			const enhancedConstraints = getEnhancedCameraConstraints({ deviceId })
			const fallbackConstraints = [
				enhancedConstraints,
				// If a specific deviceId fails (e.g. permission mismatch), fall back to environment.
				{ video: { facingMode: { ideal: 'environment' } }, audio: false },
				{ video: { facingMode: 'environment' }, audio: false },
				{ video: true, audio: false },
			]

			// Try camera access using a set of fallbacks (deviceId -> environment -> generic)
            const getStreamWithFallbacks = async () => {
                let lastErr = null
                for (const constraints of fallbackConstraints) {
					try {
						const stream = await navigator.mediaDevices.getUserMedia(constraints)
						return stream
					} catch (err) {
						lastErr = err
						// If user denied permission, don't keep retrying.
						if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') throw err
					}
				}
                throw lastErr || new Error('Unable to access camera')
            };

			let canUseBarcodeDetector = false
			if ('BarcodeDetector' in window) {
				try {
					const formats = await window.BarcodeDetector.getSupportedFormats?.()
					canUseBarcodeDetector = !formats || formats.includes('qr_code')
				} catch {
					canUseBarcodeDetector = true
				}
			}

			if (canUseBarcodeDetector) {
				const stream = await getStreamWithFallbacks()
				streamRef.current = stream
				video.srcObject = stream
				await video.play()
				await applyBestEffortVideoTrackConstraints(stream)

				try {
					const track = stream?.getVideoTracks?.()?.[0]
					setFlipPreviewX(isUserFacingTrack(track))
					const settings = track?.getSettings?.() || {}
					if (settings?.deviceId) {
						setActiveDeviceId(String(settings.deviceId))
						lastRequestedDeviceIdRef.current = String(settings.deviceId)
					}
				} catch {
					// ignore
				}
				if (!enumeratedOnce) {
					try {
						const inputs = await listVideoInputs()
						setVideoInputs(inputs)
						setEnumeratedOnce(true)
					} catch {
						// ignore
					}
				}

				let detector
				try {
					detector = new window.BarcodeDetector({ formats: ['qr_code'] })
				} catch {
					// Some browsers expose BarcodeDetector but throw on construction/options.
					detector = null
				}
				if (detector) {
					setScanning(true)

					scanTimerRef.current = window.setInterval(
					// Poll video frames, run QR detection, and submit payload when a code is found
                    async () => {
                        if (detectingRef.current) return
                        try {
                            detectingRef.current = true
                            const v = videoRef.current
                            const canvas = canvasRef.current
                            if (!v || !canvas) return
                            if (v.readyState < 2) return

                            const w = v.videoWidth
                            const h = v.videoHeight
                            if (!w || !h) return

                            if (canvas.width !== w) canvas.width = w
                            if (canvas.height !== h) canvas.height = h
                            const ctx = canvas.getContext('2d', { willReadFrequently: true })
                            if (!ctx) return
                            ctx.drawImage(v, 0, 0, w, h)

                            let codes = await detector.detect(canvas)
                            if (!codes || codes.length === 0) {
                                // Center-crop “zoom-in” pass helps with small printed QRs
                                const crops = [0.6, 0.35]
                                for (const scale of crops) {
                                    const sw = Math.floor(w * scale)
                                    const sh = Math.floor(h * scale)
                                    const sx = Math.floor((w - sw) / 2)
                                    const sy = Math.floor((h - sh) / 2)
                                    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, w, h)
                                    codes = await detector.detect(canvas)
                                    if (codes && codes.length > 0) break
                                }
                            }
                            if (!codes || codes.length === 0) return

                            const rawValue = codes[0]?.rawValue
                            if (!rawValue) return

                            const now = Date.now()
                            const last = lastSeenRef.current
                            if (last.value === rawValue && now - last.at < 2000) return
                            lastSeenRef.current = { value: rawValue, at: now }

                            await submitPayload(rawValue, 'qr')
                        } catch {
                            // ignore per-frame errors
                        } finally {
                            detectingRef.current = false
                        }
                    }, 200)
					return
				}

				// BarcodeDetector not usable -> fall back to ZXing with the existing stream.
				const { BrowserQRCodeReader } = await import('@zxing/browser')
				const reader = new BrowserQRCodeReader()
				setScanning(true)
				const controls = await reader.decodeFromVideoElement(video, // ZXing per-frame decode callback (fallback when BarcodeDetector isn't available)
                async result => {
                    if (!result) return
                    const rawValue = typeof result.getText === 'function' ? result.getText() : String(result)
                    if (!rawValue) return

                    const now = Date.now()
                    const last = lastSeenRef.current
                    if (last.value === rawValue && now - last.at < 2000) return
                    lastSeenRef.current = { value: rawValue, at: now }

                    await submitPayload(rawValue, 'qr')
                })
				zxingControlsRef.current = controls
				return
			}

			const stream = await getStreamWithFallbacks()
			streamRef.current = stream
			video.srcObject = stream
			await video.play()
			await applyBestEffortVideoTrackConstraints(stream)

			try {
				const track = stream?.getVideoTracks?.()?.[0]
				setFlipPreviewX(isUserFacingTrack(track))
				const settings = track?.getSettings?.() || {}
				if (settings?.deviceId) {
					setActiveDeviceId(String(settings.deviceId))
					lastRequestedDeviceIdRef.current = String(settings.deviceId)
				}
			} catch {
				// ignore
			}
			if (!enumeratedOnce) {
				try {
					const inputs = await listVideoInputs()
					setVideoInputs(inputs)
					setEnumeratedOnce(true)
				} catch {
					// ignore
				}
			}

			const { BrowserQRCodeReader } = await import('@zxing/browser')
			const reader = new BrowserQRCodeReader()
			setScanning(true)
			const controls = await reader.decodeFromVideoElement(video, // ZXing per-frame decode callback (QR scan)
            async result => {
                if (!result) return
                const rawValue = typeof result.getText === 'function' ? result.getText() : String(result)
                if (!rawValue) return

                const now = Date.now()
                const last = lastSeenRef.current
                if (last.value === rawValue && now - last.at < 2000) return
                lastSeenRef.current = { value: rawValue, at: now }

                await submitPayload(rawValue, 'qr')
            })
			zxingControlsRef.current = controls
		} catch (e) {
			const msg = e?.message || e?.name || 'Failed to start camera'
			if (/secure context|notallowed|permission/i.test(msg)) {
				setCameraError('Camera blocked. Use HTTPS (or localhost) and allow camera permission in the browser.')
			} else {
				setCameraError(msg)
			}
			void showPopup({
				icon: 'error',
				title: 'Camera error',
				text: /secure context|notallowed|permission/i.test(msg)
					? 'Use HTTPS/localhost and allow camera permission.'
					: msg,
				ms: 3200,
			})
			stopCamera()
		} finally {
			setStarting(false)
		}
    }, [stopCamera, submitPayload, showPopup, getEnhancedCameraConstraints, applyBestEffortVideoTrackConstraints, listVideoInputs, enumeratedOnce, isUserFacingTrack])

    const canSwitchCamera = scanning && !starting && videoInputs.length > 1

	const switchCamera = React.useCallback(
	// Switch to the next available camera device (front/back) while scanning
    async () => {
        if (!canSwitchCamera) return
        const currentId = String(activeDeviceId || lastRequestedDeviceIdRef.current || '')
		const idx = videoInputs.findIndex(
		// Find the index of the currently active camera device
        d => {
            return String(d.deviceId) === currentId;
        })
        const next = videoInputs[(idx >= 0 ? idx + 1 : 0) % videoInputs.length]
        if (!next?.deviceId) return
        lastRequestedDeviceIdRef.current = String(next.deviceId)
        setActiveDeviceId(String(next.deviceId))
        await startCamera({ deviceId: String(next.deviceId) })
    }, [activeDeviceId, canSwitchCamera, startCamera, videoInputs])

    const cardStyle = {
		background: 'rgba(15, 25, 50, 0.75)',
		border: '1px solid rgba(0, 255, 212, 0.25)',
		borderRadius: '16px',
		padding: 'clamp(14px, 2.2vw, 22px)',
	}

    const fullViewportScannerStyle = {
		position: 'fixed',
		inset: 0,
		width: '100vw',
		height: '100vh',
		overflow: 'hidden',
		borderRadius: 0,
		background: 'rgba(0,0,0,0.35)',
		zIndex: 1000,
	}

    const compactScannerStyle = {
		position: 'relative',
		borderRadius: '12px',
		overflow: 'hidden',
		background: 'rgba(0,0,0,0.35)',
	}

    const useFullViewportPreview = scanning

    const tipText = 'Zoom the QR (bring it closer) and keep it centered.'

    return (
        <div
			style={{
				minHeight: '100vh',
				background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)',
				fontFamily: 'Poppins, system-ui',
			}}
		>
            {/* Intentionally hidden on scanner page */}
            <div style={{ padding: 'clamp(16px, 4vw, 40px)', maxWidth: '1400px', margin: '0 auto' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
					<div>
						<h1 style={{ color: '#00FFD4', fontSize: 'clamp(1.5rem, 3.6vw, 2.2rem)', fontWeight: 700, margin: 0 }}>Attendance Scanner</h1>
						<p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>Scan member QR to instantly record attendance.</p>
					</div>
					<div />
				</div>

				<div className="attendance-scan-layout">
					<div className="attendance-scan-camera" style={cardStyle}>
						<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
							<div>
								<h2 style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: '1.2rem', fontWeight: 700 }}>Camera Scan</h2>
								<p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.6)' }}>{scanning ? 'Scanning… hold the QR steady' : 'Start the camera to scan member QR codes'}</p>
								{scanning ? (
									<div
										style={{
											marginTop: '10px',
											display: 'inline-flex',
											alignItems: 'center',
											gap: '8px',
											padding: '10px 12px',
											borderRadius: '12px',
											background: 'rgba(0, 255, 212, 0.12)',
											border: '1px solid rgba(0, 255, 212, 0.30)',
											color: 'rgba(255,255,255,0.92)',
											fontWeight: 700,
										}}
									>
										{tipText}
									</div>
								) : null}
							</div>
							<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
								{!scanning ? (
									<button
										onClick={// Start camera preview and begin QR scanning
												() => {
                                            return startCamera();
                                        }}
										disabled={starting}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											padding: '10px 16px',
											background: 'rgba(0, 255, 212, 0.15)',
											color: '#00FFD4',
											border: '1px solid rgba(0, 255, 212, 0.35)',
											borderRadius: '10px',
											cursor: starting ? 'not-allowed' : 'pointer',
											fontWeight: 600,
											opacity: starting ? 0.75 : 1,
										}}
									>
										<FaCamera /> {starting ? 'Starting…' : 'Start Camera'}
									</button>
								) : useFullViewportPreview ? (
									// Controls are shown as an overlay on the fullscreen scanner.
									(<div />)
								) : (
									<>
										<button
											onClick={switchCamera}
											disabled={!canSwitchCamera}
											title={canSwitchCamera ? 'Switch camera' : 'No alternate camera found'}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												padding: '10px 14px',
												background: 'rgba(255, 255, 255, 0.10)',
												color: 'rgba(255,255,255,0.92)',
												border: '1px solid rgba(255,255,255,0.20)',
												borderRadius: '10px',
												cursor: canSwitchCamera ? 'pointer' : 'not-allowed',
												fontWeight: 600,
												opacity: canSwitchCamera ? 1 : 0.55,
											}}
										>
											<FaSyncAlt /> Switch
										</button>
										<button
											onClick={stopCamera}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												padding: '10px 16px',
												background: 'rgba(255, 50, 100, 0.2)',
												color: '#FF6B9D',
												border: '1px solid rgba(255, 50, 100, 0.4)',
												borderRadius: '10px',
												cursor: 'pointer',
												fontWeight: 600,
											}}
										>
											<FaStopCircle /> Stop
										</button>
									</>
								)}
							</div>
						</div>

						{cameraError ? (
							<div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255, 50, 100, 0.12)', border: '1px solid rgba(255, 50, 100, 0.35)', color: 'rgba(255,255,255,0.85)' }}>
								<strong style={{ color: '#FF6B9D' }}>Camera:</strong> {cameraError}
							</div>
						) : null}

						<div style={{ marginTop: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(10, 14, 39, 0.75)', padding: '14px' }}>
							<div style={useFullViewportPreview ? fullViewportScannerStyle : compactScannerStyle}>
								{useFullViewportPreview ? (
									<div
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											zIndex: 2,
											padding: '14px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'flex-start',
											gap: '12px',
											background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0))',
											pointerEvents: 'auto',
										}}
									>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'none' }}>
											<div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 800 }}>Scanning…</div>
											<div
												style={{
													display: 'inline-flex',
													alignItems: 'center',
													gap: '8px',
													padding: '10px 12px',
													borderRadius: '12px',
													background: 'rgba(0, 255, 212, 0.12)',
													border: '1px solid rgba(0, 255, 212, 0.30)',
													color: 'rgba(255,255,255,0.92)',
													fontWeight: 800,
												}}
											>
												{tipText}
											</div>
										</div>
										<div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
											<button
												onClick={switchCamera}
												disabled={!canSwitchCamera}
												title={canSwitchCamera ? 'Switch camera' : 'No alternate camera found'}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													padding: '10px 14px',
													background: 'rgba(255, 255, 255, 0.10)',
													color: 'rgba(255,255,255,0.92)',
													border: '1px solid rgba(255,255,255,0.20)',
													borderRadius: '10px',
													cursor: canSwitchCamera ? 'pointer' : 'not-allowed',
													fontWeight: 600,
													opacity: canSwitchCamera ? 1 : 0.55,
												}}
											>
												<FaSyncAlt /> Switch
											</button>
											<button
												onClick={stopCamera}
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													padding: '10px 16px',
													background: 'rgba(255, 50, 100, 0.2)',
													color: '#FF6B9D',
													border: '1px solid rgba(255, 50, 100, 0.4)',
													borderRadius: '10px',
													cursor: 'pointer',
													fontWeight: 600,
												}}
											>
												<FaStopCircle /> Stop
											</button>
										</div>
									</div>
								) : null}
								<video
									ref={videoRef}
									autoPlay
									playsInline
									muted
									style={{
										position: useFullViewportPreview ? 'absolute' : 'static',
										inset: useFullViewportPreview ? 0 : undefined,
										zIndex: useFullViewportPreview ? 1 : undefined,
										width: useFullViewportPreview ? '100vw' : '100%',
										height: useFullViewportPreview ? '100vh' : 'clamp(260px, 52vh, 420px)',
										objectFit: 'cover',
										transform: flipPreviewX ? 'scaleX(-1)' : 'none',
										transformOrigin: 'center',
										opacity: scanning ? 1 : 0.35,
									}}
								/>
								<div
									style={{
										position: 'absolute',
										inset: useFullViewportPreview ? 'clamp(14px, 3.5vw, 28px)' : '18px',
										borderRadius: '16px',
										border: '2px dashed rgba(0, 255, 212, 0.55)',
										boxShadow: 'inset 0 0 0 2000px rgba(0,0,0,0.10)',
										pointerEvents: 'none',
									}}
								/>
								<canvas ref={canvasRef} style={{ display: 'none' }} />
							</div>
						</div>
					</div>

					<div className="attendance-scan-side">
						<div style={cardStyle}>
							<h2 style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: '1.2rem', fontWeight: 700 }}>Manual Entry</h2>
							<p style={{ margin: '8px 0 14px 0', color: 'rgba(255,255,255,0.6)' }}>Paste The Members ID.</p>

							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
								<input
									value={manualPayload}
									onChange={// Track manual member ID input (fallback if QR can't be scanned)
									e => {
                                        return setManualPayload(e.target.value);
                                    }}
									placeholder="Enter 8 chars"
									style={{
										padding: '12px 14px',
										borderRadius: '12px',
										border: '1px solid rgba(255,255,255,0.14)',
										background: 'rgba(10, 14, 39, 0.65)',
										color: 'rgba(255,255,255,0.92)',
										outline: 'none',
									}}
								/>
								<button
									onClick={// Submit manual member ID to record attendance without camera
									async () => {
                                        await submitPayload(manualPayload, 'manual')
                                        setManualPayload('')
                                    }}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '12px 16px',
										background: 'rgba(0, 255, 212, 0.15)',
										color: '#00FFD4',
										border: '1px solid rgba(0, 255, 212, 0.35)',
										borderRadius: '12px',
										cursor: 'pointer',
										fontWeight: 600,
										justifyContent: 'center',
									}}
								>
									<FaKeyboard /> Record
								</button>
							</div>
						</div>

						<div style={cardStyle}>
							<h2 style={{ margin: 0, color: 'rgba(255,255,255,0.92)', fontSize: '1.2rem', fontWeight: 700 }}>Last Scan</h2>
							<div style={{ marginTop: '14px' }}>
								{lastScan?.error ? (
									<div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 50, 100, 0.12)', border: '1px solid rgba(255, 50, 100, 0.35)', color: 'rgba(255,255,255,0.85)' }}>
										<strong style={{ color: '#FF6B9D' }}>Error:</strong> {lastScan.error}
									</div>
								) : lastScan?.member ? (
									<div style={{ padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(10, 14, 39, 0.65)' }}>
										<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
											<div>
													<div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>MEMBER</div>
													<div style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.15rem', fontWeight: 700, marginTop: '6px' }}>{lastScan.member?.name || '—'}</div>
												<div style={{ color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>Plan: {lastScan.member?.planId?.planName || '—'}</div>
											</div>
											<div style={{ textAlign: 'right' }}>
													<div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>RESULT</div>
												<div
													style={{
														marginTop: '6px',
														display: 'inline-flex',
														alignItems: 'center',
														padding: '8px 12px',
														borderRadius: '999px',
														border: lastScan.attendance?.result === 'rejected' ? '1px solid rgba(255, 50, 100, 0.55)' : '1px solid rgba(0, 255, 212, 0.55)',
														background: lastScan.attendance?.result === 'rejected' ? 'rgba(255, 50, 100, 0.14)' : 'rgba(0, 255, 212, 0.14)',
														color: lastScan.attendance?.result === 'rejected' ? '#FF6B9D' : '#00FFD4',
															fontWeight: 700,
														fontSize: '0.9rem',
													}}
												>
													{lastScan.attendance?.result === 'rejected' ? 'REJECTED' : 'ACCEPTED'}
												</div>
												<div style={{ color: 'rgba(255,255,255,0.55)', marginTop: '8px', fontSize: '0.85rem' }}>{lastScan.duplicate ? 'Duplicate scan (ignored)' : formatTime(lastScan.attendance?.scannedAt, { seconds: true })}</div>
											</div>
										</div>
										{lastScan.attendance?.reason ? <div style={{ marginTop: '12px', color: 'rgba(255,255,255,0.75)' }}>{lastScan.attendance.reason}</div> : null}
									</div>
								) : (
									<div style={{ color: 'rgba(255,255,255,0.6)' }}>No scans yet.</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
        </div>
    );
}