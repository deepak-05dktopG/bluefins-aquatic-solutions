import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCamera, FaKeyboard, FaStopCircle, FaSyncAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'
import { adminFetch, isAdminAuthenticated } from '../../utils/adminAuth'
import { formatTime } from '../../utils/dateTime'

const safeReadJson = async (res) => {
	const text = await res.text()
	if (!text) return { ok: false, message: 'Empty response from server' }
	try {
		return JSON.parse(text)
	} catch {
		return { ok: false, message: text }
	}
}



export default function AttendanceScan() {
	const navigate = useNavigate()
	const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

	const isLikelyMobile = React.useMemo(() => {
		if (typeof navigator === 'undefined') return false
		return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
	}, [])

	const isLikelyIOSSafari = React.useMemo(() => {
		if (typeof navigator === 'undefined') return false
		const ua = navigator.userAgent || ''
		const isIOS = /iPhone|iPad|iPod/i.test(ua)
		const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|EdgiOS|FxiOS/i.test(ua)
		return isIOS && isSafari
	}, [])

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

	const listVideoInputs = React.useCallback(async () => {
		if (!navigator.mediaDevices?.enumerateDevices) return []
		const all = await navigator.mediaDevices.enumerateDevices()
		return (all || []).filter((d) => d && d.kind === 'videoinput')
	}, [])

	const getEnhancedCameraConstraints = React.useCallback(
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

	const applyBestEffortVideoTrackConstraints = React.useCallback(async (stream) => {
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
	const [manualPayload, setManualPayload] = React.useState('')
	const [lastScan, setLastScan] = React.useState(null)
	const [cameraError, setCameraError] = React.useState('')

	const showPopup = React.useCallback(async ({ icon, title, text, ms = 2200 }) => {
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
			didOpen: (popup) => {
				popup.addEventListener('mouseenter', Swal.stopTimer)
				popup.addEventListener('mouseleave', Swal.resumeTimer)
			},
		})
	}, [])

	React.useEffect(() => {
		if (!isAdminAuthenticated()) navigate('/admin')
	}, [navigate])

	const stopCamera = React.useCallback(() => {
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
	}, [])

	React.useEffect(() => {
		return () => stopCamera()
	}, [stopCamera])

	const submitPayload = React.useCallback(
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
					void showPopup({
						icon: 'warning',
						title: 'Entry not allowed',
						text: attendance?.reason || 'This membership is not active.',
						ms: 3200,
					})
					return
				}

				void showPopup({
					icon: 'success',
					title: 'Checked in successfully',
					text: `${member?.name || 'Member'} attendance has been recorded.`,
					ms: 2000,
				})
			} catch (e) {
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

	const startCamera = React.useCallback(async ({ deviceId } = {}) => {
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
			}

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

				const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
				setScanning(true)

				scanTimerRef.current = window.setInterval(async () => {
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

			const stream = await getStreamWithFallbacks()
			streamRef.current = stream
			video.srcObject = stream
			await video.play()
			await applyBestEffortVideoTrackConstraints(stream)

			try {
				const track = stream?.getVideoTracks?.()?.[0]
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
			const controls = await reader.decodeFromVideoElement(video, async (result) => {
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
	}, [stopCamera, submitPayload, showPopup, getEnhancedCameraConstraints, applyBestEffortVideoTrackConstraints, listVideoInputs, enumeratedOnce])

	const canSwitchCamera = scanning && !starting && videoInputs.length > 1

	const switchCamera = React.useCallback(async () => {
		if (!canSwitchCamera) return
		const currentId = String(activeDeviceId || lastRequestedDeviceIdRef.current || '')
		const idx = videoInputs.findIndex((d) => String(d.deviceId) === currentId)
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
								<p style={{ margin: '6px 0 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
									Tip: Zoom the QR (bring it closer) and keep it centered inside the box.
								</p>
							</div>
							<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
								{!scanning ? (
									<button
										onClick={startCamera}
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
							<div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.35)' }}>
								<video
									ref={videoRef}
									playsInline
									muted
									style={{
										width: '100%',
										height: 'clamp(260px, 52vh, 420px)',
										objectFit: 'cover',
										opacity: scanning ? 1 : 0.35,
									}}
								/>
								<div
									style={{
										position: 'absolute',
										inset: '18px',
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
									onChange={(e) => setManualPayload(e.target.value)}
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
									onClick={async () => {
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
	)
}
