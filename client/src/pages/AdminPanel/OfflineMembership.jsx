/**
 * What it is: Admin panel page (Offline membership / cash registration).
 * Non-tech note: Admins can register members and generate their ID cards.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { downloadMemberIdCard } from '../../utils/idCard'
import { adminFetch, isAdminAuthenticated } from '../../utils/adminAuth'
import AdminNavbar from '../../components/adminPanel/AdminNavbar'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

const PLAN_TYPE_LABEL = {
	summer: 'Summer Camp',
	monthly: 'Monthly Training',
	yearly: 'Individual (1 Year)',
	family: 'Family (1 Year)',
	public: 'Public Batch (Per Session)',
}

const CATEGORY_LABEL = {
	infant: 'Infant (2–6)',
	kids: 'Kids (6–18)',
	adult: 'Adult (18+)',
}

const emptyMember = { name: '', phone: '', age: '', gender: 'other' }
const emptyFamilyMember = { name: '', phone: '', age: '', gender: 'other' }

/**
 * Normalize free-text inputs from the offline desk registration form.
 * Trims whitespace and converts null/undefined to an empty string.
 */
const normalizeText = v => {
    return (v == null ? '' : String(v)).trim();
};

/**
 * Normalize WhatsApp/phone numbers into a consistent 10-digit format.
 * Handles common prefixes like +91 and leading 0.
 */
const normalizePhone10 = v => {
    const raw = normalizeText(v)
    if (!raw) return ''
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
    return digits
};

/**
 * Validate that a phone number is exactly 10 digits.
 */
const isValidPhone10 = v => {
    return /^\d{10}$/.test(String(v || ''));
};

/**
 * Normalize gender inputs to one of: male/female/other.
 */
const normalizeGender = v => {
    const raw = normalizeText(v)
    if (!raw) return 'other'
    const g = raw.toLowerCase()
    if (g === 'male' || g === 'female' || g === 'other') return g
    return null
};

/**
 * Parse and validate age from the form (optional but bounded).
 */
const normalizeAge = v => {
    if (v == null || v === '') return { ok: true, age: undefined }
    const n = Number(v)
    if (!Number.isFinite(n)) return { ok: false, message: 'Age must be a number' }
    if (n < 1 || n > 120) return { ok: false, message: 'Age must be between 1 and 120' }
    return { ok: true, age: Math.floor(n) }
};

/**
 * Display-friendly payment provider label used on the confirmation screen.
 */
const paymentTypeLabel = provider => {
    const p = String(provider || '').toLowerCase()
    if (p === 'razorpay') return 'Online (Razorpay)'
    if (p === 'cash' || p === 'mock') return 'Cash (Offline)'
    if (!p) return '—'
    return p
};

/**
 * Utility: safely parse JSON responses from the backend.
 * Offline registration is used during desk operations, so this also provides
 * a clear error when the backend is unreachable or returns non-JSON.
 */
const safeReadJson = async res => {
    const contentType = res.headers.get('content-type') || ''
    const raw = await res.text()
    if (!raw) return { ok: true, data: null }
    if (!contentType.includes('application/json')) {
		return { ok: false, error: `Non-JSON response (${res.status}). Is the backend running?` }
	}
    try {
		return { ok: true, data: JSON.parse(raw) }
	} catch {
		return { ok: false, error: 'Failed to parse JSON response. Is the backend running?' }
	}
};

const STEP = {
	PLAN: 1,
	DETAILS: 2,
	DONE: 3,
}

/**
 * Bluefins admin flow: Offline Membership Registration.
 * Used when a customer pays cash/in-hand at the pool/desk (no Razorpay).
 * Creates the member(s) and allows immediate ID card (QR) download.
 */
const OfflineMembership = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(STEP.PLAN)
    const [plans, setPlans] = useState([])
    const [loadingPlans, setLoadingPlans] = useState(false)
    const [testAmountInr, setTestAmountInr] = useState(null)
    const [selectedPlanId, setSelectedPlanId] = useState('')
    const [member, setMember] = useState(emptyMember)
    const [selection, setSelection] = useState({
		category: 'kids',
		coachingAddOn: false,
		quantity: 1,
		publicSlot: { date: '', startTime: '10:00', endTime: '' },
	})
    const [familyMembers, setFamilyMembers] = useState([emptyFamilyMember])
    const [collectedBy, setCollectedBy] = useState(/**
     * Load the last “Collected by” staff name to speed up desk workflows.
     */
    () => {
        try {
			return localStorage.getItem('offlineCollectedBy') || ''
		} catch {
			return ''
		}
    })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)

    useEffect(/**
     * Admin-only guard: redirect to login if session is missing.
     */
    () => {
        if (!isAdminAuthenticated()) navigate('/admin')
    }, [navigate])

    const selectedPlan = useMemo(/**
     * Resolve the selected plan object from the loaded plan list.
     */
    () => {
        return plans.find(/**
         * Match the current selected plan id.
         */
        p => {
            return p._id === selectedPlanId;
        }) || null;
    }, [plans, selectedPlanId])

    /**
     * Format currency amounts for the summary panel.
     */
    const formatInr = value => {
        const n = Number(value)
        if (!Number.isFinite(n)) return '—'
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
    };

    const computedSubtotal = useMemo(/**
        * Compute the amount to collect (before any online fees).
        * Pricing rules differ by plan type (public per-session, category-based, etc.).
     */
    () => {
        if (testAmountInr != null) return Number(testAmountInr)
        if (!selectedPlan) return null

        if (selectedPlan.type === 'public') {
			const qty = Number(selection.quantity || 1)
			const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1
			return (selectedPlan.basePrice || 0) * safeQty
		}

        if (selectedPlan.categoryRequired) {
			const category = selection.category
			const row = (selectedPlan.categoryPrices || []).find(/**
             * Find the price row for the chosen category.
             */
            x => {
                return x.category === category;
            })
			return row ? row.price : null
		}

        let base = selectedPlan.basePrice || 0
        if (selectedPlan.type === 'yearly' && selection.coachingAddOn) {
			base += selectedPlan.addOns?.coachingAddOnMonthly || 0
		}

        return base
    }, [selectedPlan, selection, testAmountInr])

    const computedTotal = useMemo(/**
        * Total to collect for offline cash registrations.
        * Note: no Razorpay fee/GST is applied here.
     */
    () => {
        if (testAmountInr != null) return Number(testAmountInr)
        // Offline cash registrations do not add Razorpay fee/GST.
        return computedSubtotal
    }, [computedSubtotal, testAmountInr])

    const peopleCount = useMemo(/**
        * Headcount summary shown in the side panel.
        * Family plans count members; public plans use the per-session quantity.
     */
    () => {
        if (!selectedPlan) return null
        if (selectedPlan.type === 'family') return (familyMembers || []).length
        if (selectedPlan.type === 'public') {
			const qty = Number(selection.quantity || 1)
			return Number.isFinite(qty) && qty > 0 ? qty : 1
		}
        return 1
    }, [selectedPlan, familyMembers, selection.quantity])

    useEffect(/**
     * When switching away from Family plans, reset the family-members list.
     */
    () => {
        if (selectedPlan?.type !== 'family') setFamilyMembers([emptyFamilyMember])
    }, [selectedPlan?.type])

    /**
     * Fetch active membership plans so staff can pick a plan for offline signup.
     */
    const fetchPlans = async () => {
        setError('')
        setLoadingPlans(true)
        try {
			const res = await fetch(`${apiBase}/membership/plans?isActive=true`)
			const parsed = await safeReadJson(res)
			if (!parsed.ok) throw new Error(parsed.error)
			const data = parsed.data
			if (!res.ok) throw new Error(data?.message || `Failed to load plans (${res.status})`)
			if (typeof data?.meta?.testAmountInr === 'number' && Number.isFinite(data.meta.testAmountInr)) {
				setTestAmountInr(data.meta.testAmountInr)
			} else {
				setTestAmountInr(null)
			}
			const list = data?.data || []
			const typeOrder = ['public', 'monthly', 'summer', 'yearly', 'family']
			const sorted = [...list].sort(/**
             * Sort plans into a staff-friendly order (type, then price, then name).
             */
            (a, b) => {
                const ai = typeOrder.indexOf(a?.type)
                const bi = typeOrder.indexOf(b?.type)
                const ao = ai === -1 ? typeOrder.length : ai
                const bo = bi === -1 ? typeOrder.length : bi
                if (ao !== bo) return ao - bo
                const ap = Number(a?.basePrice ?? a?.price ?? 0)
                const bp = Number(b?.basePrice ?? b?.price ?? 0)
                if (ap !== bp) return ap - bp
                return String(a?.planName ?? a?.name ?? '').localeCompare(String(b?.planName ?? b?.name ?? ''))
            })
			setPlans(sorted)
			if (sorted.length && (!selectedPlanId || !sorted.some(/**
             * Ensure the selected plan still exists after refresh.
             */
            p => {
                return p._id === selectedPlanId;
            }))) {
				setSelectedPlanId(sorted[0]._id)
			}
		} catch (e) {
			setError(e.message)
		} finally {
			setLoadingPlans(false)
		}
    };

    useEffect(/**
     * Initial load: fetch plans once when the screen opens.
     */
    () => {
        fetchPlans()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Validate the offline registration form before submitting.
     * Returns an error message string or an empty string when valid.
     */
    const validate = () => {
        if (!selectedPlan) return 'Please select a plan'
        if (!normalizeText(collectedBy)) return 'Collected by (admin name) is required'

        // Shared validations
        if (selectedPlan.categoryRequired) {
			if (!selection.category) return 'Select a category'
			const allowed = (selectedPlan.categoryPrices || []).map(/**
             * Normalize allowed category keys from the plan config.
             */
            x => {
                return String(x?.category || '').toLowerCase();
            })
			if (allowed.length && !allowed.includes(String(selection.category).toLowerCase())) return 'Select a valid category'
		}

        if (selectedPlan.type === 'public') {
			if (!selection.publicSlot?.date) return 'Select a date'
			if (!selection.publicSlot?.startTime) return 'Select a start time'
			const qty = Number(selection.quantity)
			if (!Number.isFinite(qty) || qty < 1) return 'People must be at least 1'
		}

        if (selectedPlan.type === 'family') {
			const contactName = normalizeText(member.name)
			const contactPhone = normalizePhone10(member.phone)
			if (!contactName) return 'Contact name is required'
			if (!contactPhone) return 'Contact WhatsApp number is required'
			if (!isValidPhone10(contactPhone)) return 'Contact WhatsApp number must be a valid 10-digit number'
			const list = Array.isArray(familyMembers) ? familyMembers : []
			if (!list.length) return 'Add at least 1 family member'
			if (selectedPlan.maxMembers && list.length > selectedPlan.maxMembers) {
				return `Maximum ${selectedPlan.maxMembers} members allowed for this plan`
			}
			for (const fm of list) {
				const n = normalizeText(fm?.name)
				if (!n) return 'Each family member needs a name'
				const p = normalizePhone10(fm?.phone)
				if (p && !isValidPhone10(p)) return 'Family member WhatsApp number must be a valid 10-digit number'
				const g = normalizeGender(fm?.gender)
				if (g === null) return 'Family member gender must be Male/Female/Other'
				const a = normalizeAge(fm?.age)
				if (!a.ok) return `Family member ${a.message}`
			}
			return ''
		}

        const name = normalizeText(member.name)
        const phone = normalizePhone10(member.phone)
        if (!name) return 'Name is required'
        if (!phone) return 'WhatsApp number is required'
        if (!isValidPhone10(phone)) return 'WhatsApp number must be a valid 10-digit number'
        const g = normalizeGender(member.gender)
        if (g === null) return 'Gender must be Male/Female/Other'
        const a = normalizeAge(member.age)
        if (!a.ok) return a.message
        return ''
    };

    /**
        * Submit the offline registration to the admin API.
        * On success, transitions to the confirmation step and enables ID card download.
     */
    const submitOffline = async () => {
        const err = validate()
        if (err) {
			setError(err)
			return
		}

        setBusy(true)
        setError('')
        try {
			const normalizedMember = {
				...member,
				name: normalizeText(member?.name),
				phone: normalizePhone10(member?.phone),
				age: member?.age ? Number(member.age) : undefined,
				gender: (normalizeGender(member?.gender) || 'other'),
			}

			const payload = {
				collectedBy: normalizeText(collectedBy),
				planId: selectedPlanId,
				member: {
					name: normalizedMember.name,
					phone: normalizedMember.phone,
					age: normalizedMember.age,
					gender: normalizedMember.gender,
				},
				selection,
				familyMembers: selectedPlan?.type === 'family'
					? familyMembers.map(/**
                 * Normalize each family member record for storage.
                 */
                m => {
                    return ({
                        name: normalizeText(m?.name),
                        phone: normalizePhone10(m?.phone),
                        age: m?.age ? Number(m.age) : undefined,
                        gender: (normalizeGender(m?.gender) || 'other')
                    });
                })
					: undefined,
			}

			const res = await adminFetch(`${apiBase}/admin/membership/offline-register`, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify(payload),
			})
			const parsed = await safeReadJson(res)
			if (!parsed.ok) throw new Error(parsed.error)
			const data = parsed.data
			if (!res.ok) throw new Error(data?.message || `Registration failed (${res.status})`)

			try {
				localStorage.setItem('offlineCollectedBy', normalizeText(collectedBy))
			} catch {
				// ignore
			}

			setResult(data?.data || null)
			setStep(STEP.DONE)
		} catch (e) {
			setError(e.message)
		} finally {
			setBusy(false)
		}
    };

    /**
        * Reset the wizard to start a fresh offline registration.
     */
    const resetAll = () => {
        setResult(null)
        setError('')
        setMember(emptyMember)
        setSelection({ category: 'kids', coachingAddOn: false, quantity: 1, publicSlot: { date: '', startTime: '10:00', endTime: '' } })
        setFamilyMembers([emptyFamilyMember])
        setStep(STEP.PLAN)
    };

    /**
        * Small display helper for the plan-selection grid cards.
     */
    const planCardPrice = p => {
        if (!p) return '—'
        if (p.categoryRequired) {
			const prices = (p.categoryPrices || [])
				.map(/**
             * Extract numeric price values.
             */
            x => {
                return Number(x?.price);
            })
				.filter(/**
             * Keep only valid positive prices.
             */
            x => {
                return Number.isFinite(x) && x > 0;
            })
			const min = prices.length ? Math.min(...prices) : null
			return min == null ? '—' : `From ₹${min}`
		}
        if (p.type === 'public') {
			const base = Number(p.basePrice || 0)
			return Number.isFinite(base) ? `₹${base} / person` : '—'
		}
        const base = Number(p.basePrice || 0)
        return Number.isFinite(base) ? `₹${base}` : '—'
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)' }}>
            <AdminNavbar />
            <div className="container-fluid" style={{ padding: '28px 28px 60px 28px', maxWidth: 1600 }}>
				<div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
					<div>
						<h2 style={{ color: '#00FFD4', margin: 0, fontWeight: 900 }}>Offline Membership Registration</h2>
						<div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
							Register customers who pay cash/in-hand (no Razorpay). Generates ID cards immediately.
						</div>
					</div>
					<button className="btn btn-outline-light btn-sm" onClick={/**
                     * Return to the main admin dashboard.
                     */
                    () => {
                        return navigate('/admin/dashboard');
                    }}>
						Back to Dashboard
					</button>
				</div>

				{error ? (
					<div className="alert alert-danger mt-3" role="alert">
						{error}
					</div>
				) : null}

				<div className="row g-3 mt-2">
					<div className="col-12 col-lg-8">
						<div className="p-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16 }}>
							<div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
								<div style={{ color: '#fff', fontWeight: 900 }}>
									Step {step} / 3
								</div>
								<div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
									{step === STEP.PLAN ? 'Choose plan' : step === STEP.DETAILS ? 'Enter details' : 'Done'}
								</div>
							</div>

							{step === STEP.PLAN ? (
								<div className="mt-3">
									<div className="row g-3">
										<div className="col-12 col-md-6">
											<label className="form-label" style={{ color: '#fff' }}>
												Collected By (Admin name)
											</label>
											<input
												className="form-control form-control-sm"
												placeholder="Enter admin/staff name"
												value={collectedBy}
												onChange={/**
                                                                 * Update “Collected by” staff name.
                                                 */
                                                e => {
                                                    return setCollectedBy(e.target.value);
                                                }}
											/>
											<div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 6 }}>
												This name is saved with the cash registration.
											</div>
										</div>
										<div className="col-12 col-md-6">
											<label className="form-label" style={{ color: '#fff' }}>
												Plan
											</label>
											{loadingPlans ? (
												<div style={{ color: 'rgba(255,255,255,0.8)' }}>Loading plans…</div>
											) : (
												<select
													className="form-select form-select-sm"
													value={selectedPlanId}
													onChange={/**
                                                                 * Change the selected plan.
                                                     */
                                                    e => {
                                                        return setSelectedPlanId(e.target.value);
                                                    }}
												>
            										{plans.map(/**
            										 * Render each plan option.
            										 */
                                                    p => {
                                                        return (
                                                            <option key={p._id} value={p._id}>
                                                                {p.planName || p.name || 'Membership Plan'}({PLAN_TYPE_LABEL[p.type] || p.type})
                                                                                                                        </option>
                                                        );
                                                    })}
												</select>
											)}
										</div>
									</div>

									{plans.length ? (
										<div className="membership-plan-grid mt-3">
											{plans.map(/**
                                                 * Render the plan selection cards.
                                             */
                                            p => {
                                                const isSelected = p._id === selectedPlanId
                                                return (
                                                    <button
														key={p._id}
														type="button"
														className={`membership-plan-card ${isSelected ? 'membership-plan-card--active' : ''}`}
														onClick={/**
                                                                 * Select this plan.
                                                         */
                                                        () => {
                                                            return setSelectedPlanId(p._id);
                                                        }}
													>
                                                        <div className="membership-plan-top">
															<div>
																<div className="membership-plan-name">{p.planName || p.name || 'Membership Plan'}</div>
																<div className="membership-plan-sub">{PLAN_TYPE_LABEL[p.type] || p.type}</div>
															</div>
															<div className="membership-plan-price">{planCardPrice(p)}</div>
														</div>
                                                    </button>
                                                );
                                            })}
										</div>
									) : null}

									<div className="d-flex justify-content-end mt-3">
										<button
											className="btn btn-success btn-sm"
											onClick={/**
                                                 * Move to the details step.
                                             */
                                            () => {
                                                setError('')
                                                setStep(STEP.DETAILS)
                                            }}
											disabled={!selectedPlan}
										>
											Continue
										</button>
									</div>
								</div>
							) : null}

							{step === STEP.DETAILS ? (
								<div className="mt-3">
									<div style={{ color: '#fff', fontWeight: 900, marginBottom: 8 }}>Details</div>

									{selectedPlan?.type === 'family' ? (
										<div className="row g-2">
											<div className="col-12 col-md-6">
												<label className="form-label" style={{ color: '#fff' }}>Contact Name</label>
												<input
													className="form-control form-control-sm"
													value={member.name}
													onChange={/**
                                                     * Update contact name for the family plan.
                                                     */
                                                    e => {
                                                        return setMember({ ...member, name: e.target.value });
                                                    }}
												/>
											</div>
											<div className="col-12 col-md-6">
												<label className="form-label" style={{ color: '#fff' }}>Contact WhatsApp Number</label>
												<input
													className="form-control form-control-sm"
													value={member.phone}
													onChange={/**
                                                     * Update contact WhatsApp number for the family plan.
                                                     */
                                                    e => {
                                                        return setMember({ ...member, phone: e.target.value });
                                                    }}
												/>
											</div>
										</div>
									) : (
										<div className="row g-2">
											<div className="col-12 col-md-6">
												<label className="form-label" style={{ color: '#fff' }}>Name</label>
												<input className="form-control form-control-sm" value={member.name} onChange={/**
                                                     * Update member name.
                                                 */
                                                e => {
                                                    return setMember({ ...member, name: e.target.value });
                                                }} />
											</div>
											<div className="col-12 col-md-6">
												<label className="form-label" style={{ color: '#fff' }}>WhatsApp Number</label>
												<input className="form-control form-control-sm" value={member.phone} onChange={/**
                                                     * Update member WhatsApp number.
                                                 */
                                                e => {
                                                    return setMember({ ...member, phone: e.target.value });
                                                }} />
											</div>
										</div>
									)}

									{selectedPlan?.type === 'family' ? (
										<div className="mt-3">
											<div className="d-flex align-items-center justify-content-between">
												<div style={{ color: '#fff', fontWeight: 900 }}>Family Members</div>
												<button
													type="button"
													className="btn btn-outline-light btn-sm"
													onClick={/**
                                                     * Add an additional family member row.
                                                     */
                                                    () => {
                                                        return setFamilyMembers(/**
                                                         * Append a blank member template.
                                                         */
                                                        prev => {
                                                            return [...prev, emptyFamilyMember];
                                                        });
                                                    }}
												>
													Add Member
												</button>
											</div>

											<div className="mt-2" style={{ display: 'grid', gap: 10 }}>
														{familyMembers.map(/**
														 * Render each family member input block.
														 */
                                                (fm, idx) => {
                                                    return (
                                                        <div key={idx} className="p-2" style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)' }}>
                                                            <div className="row g-2 align-items-end">
                                                                <div className="col-12 col-md-4">
                                                                    <label className="form-label" style={{ color: '#fff' }}>Name</label>
                                                                    <input
                                                                        className="form-control form-control-sm"
                                                                        value={fm.name}
                                                                        onChange={/**
                                                                         * Update this family member’s name.
                                                                         */
                                                                        e => {
                                                                            const next = [...familyMembers]
                                                                            next[idx] = { ...next[idx], name: e.target.value }
                                                                            setFamilyMembers(next)
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="col-12 col-md-3">
                                                                    <label className="form-label" style={{ color: '#fff' }}>WhatsApp Number (optional)</label>
                                                                    <input
                                                                        className="form-control form-control-sm"
                                                                        value={fm.phone}
                                                                        onChange={/**
                                                                         * Update this family member’s WhatsApp number (optional).
                                                                         */
                                                                        e => {
                                                                            const next = [...familyMembers]
                                                                            next[idx] = { ...next[idx], phone: e.target.value }
                                                                            setFamilyMembers(next)
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="col-6 col-md-2">
                                                                    <label className="form-label" style={{ color: '#fff' }}>Age</label>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control form-control-sm"
                                                                        value={fm.age}
                                                                        onChange={/**
                                                                         * Update this family member’s age.
                                                                         */
                                                                        e => {
                                                                            const next = [...familyMembers]
                                                                            next[idx] = { ...next[idx], age: e.target.value }
                                                                            setFamilyMembers(next)
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="col-6 col-md-2">
                                                                    <label className="form-label" style={{ color: '#fff' }}>Gender</label>
                                                                    <select
                                                                        className="form-select form-select-sm"
                                                                        value={fm.gender}
                                                                        onChange={/**
                                                                         * Update this family member’s gender.
                                                                         */
                                                                        e => {
                                                                            const next = [...familyMembers]
                                                                            next[idx] = { ...next[idx], gender: e.target.value }
                                                                            setFamilyMembers(next)
                                                                        }}
                                                                    >
                                                                        <option value="male">Male</option>
                                                                        <option value="female">Female</option>
                                                                        <option value="other">Other</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-12 col-md-1 d-flex justify-content-end">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={/**
                                                                         * Remove this family member row.
                                                                         */
                                                                        () => {
                                                                            return setFamilyMembers(/**
                                                                             * Filter out the index being removed.
                                                                             */
                                                                            prev => {
                                                                                return prev.filter(/**
                                                                                 * Keep all rows except the one being removed.
                                                                                 */
                                                                                (_, i) => {
                                                                                    return i !== idx;
                                                                                });
                                                                            });
                                                                        }}
                                                                        disabled={familyMembers.length <= 1}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
											</div>
										</div>
									) : null}

									{selectedPlan?.categoryRequired ? (
										<div className="mt-3" style={{ maxWidth: 360 }}>
											<label className="form-label" style={{ color: '#fff' }}>Category</label>
											<select
												className="form-select form-select-sm"
												value={selection.category}
												onChange={/**
                                                 * Update selected category for category-priced plans.
                                                 */
                                                e => {
                                                    return setSelection({ ...selection, category: e.target.value });
                                                }}
											>
												<option value="infant">{CATEGORY_LABEL.infant}</option>
												<option value="kids">{CATEGORY_LABEL.kids}</option>
												<option value="adult">{CATEGORY_LABEL.adult}</option>
											</select>
										</div>
									) : null}

									{selectedPlan?.type === 'public' ? (
										<div className="mt-3">
											<div className="row g-2" style={{ maxWidth: 640 }}>
												<div className="col-6">
													<label className="form-label" style={{ color: '#fff' }}>Date</label>
													<input
														type="date"
														className="form-control form-control-sm"
														value={selection.publicSlot.date}
														onChange={/**
                                                                 * Set the session date for a public batch (per-session) plan.
                                                         */
                                                        e => {
                                                            return setSelection({ ...selection, publicSlot: { ...selection.publicSlot, date: e.target.value } });
                                                        }}
													/>
												</div>
												<div className="col-6">
													<label className="form-label" style={{ color: '#fff' }}>People</label>
													<input
														type="number"
														min={1}
														className="form-control form-control-sm"
														value={selection.quantity}
														onChange={/**
                                                                 * Set headcount for public batch (charged per person).
                                                         */
                                                        e => {
                                                            return setSelection({ ...selection, quantity: e.target.value });
                                                        }}
													/>
												</div>
												<div className="col-6">
													<label className="form-label" style={{ color: '#fff' }}>Start Time</label>
													<input
														type="time"
														className="form-control form-control-sm"
														value={selection.publicSlot.startTime}
														onChange={/**
                                                                 * Set the session start time.
                                                         */
                                                        e => {
                                                            return setSelection({ ...selection, publicSlot: { ...selection.publicSlot, startTime: e.target.value } });
                                                        }}
													/>
												</div>
												<div className="col-6">
													<label className="form-label" style={{ color: '#fff' }}>End Time (optional)</label>
													<input
														type="time"
														className="form-control form-control-sm"
														value={selection.publicSlot.endTime}
														onChange={/**
                                                                 * Optional session end time.
                                                         */
                                                        e => {
                                                            return setSelection({ ...selection, publicSlot: { ...selection.publicSlot, endTime: e.target.value } });
                                                        }}
													/>
												</div>
											</div>
										</div>
									) : null}

									<div className="d-flex justify-content-between mt-4">
										<button className="btn btn-outline-light btn-sm" onClick={/**
                                             * Go back to plan selection.
                                         */
                                        () => {
                                            return setStep(STEP.PLAN);
                                        }} disabled={busy}>
											Back
										</button>
										<button className="btn btn-success btn-sm" onClick={submitOffline} disabled={busy}>
											{busy ? 'Creating…' : 'Create Membership'}
										</button>
									</div>
								</div>
							) : null}

							{step === STEP.DONE ? (
								<div className="mt-3">
									<div style={{ color: '#00FFD4', fontWeight: 900, fontSize: 18 }}>Created successfully</div>
									<div className="mt-2" style={{ display: 'grid', gap: 8 }}>
										<div
											className="p-2"
											style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)' }}
										>
											<div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Total collected</div>
											<div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>
												{formatInr(result?.payment?.amount ?? computedTotal)}
											</div>
											<div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
												Payment type: {paymentTypeLabel(result?.payment?.provider || 'cash')}
											</div>
											{result?.payment?.collectedBy ? (
												<div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
													Collected by: {result.payment.collectedBy}
												</div>
											) : null}
										</div>
									</div>
									<div style={{ color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
										Download ID cards for each member.
									</div>

									<div className="mt-3" style={{ display: 'grid', gap: 10 }}>
										{(result?.members || []).map(/**
                                             * Render the created members and allow downloading ID cards.
                                         */
                                        m => {
                                            return (
                                                <div
                                                    key={m._id}
                                                    className="p-2"
                                                    style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)' }}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                                                        <div>
                                                            <div style={{ color: '#fff', fontWeight: 900 }}>{m.name}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12 }}>ID: {m._id}</div>
                                                        </div>
                                                        <button
                                                            className="btn btn-outline-light btn-sm"
                                                            onClick={/**
                                                             * Download the member ID card (includes QR used for attendance scans).
                                                             */
                                                            () => {
                                                                return downloadMemberIdCard({
                                                                    name: m.name,
                                                                    memberId: m._id,
                                                                    qrDataUrl: m.qrCode,
                                                                    planName: result?.plan?.planName || selectedPlan?.planName || 'Membership',
                                                                        joinDate: m.joinDate,
                                                                    expiryDate: m.expiryDate,
                                                                });
                                                            }
                                                            }
                                                        >
                                                            Download ID Card
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
									</div>

									<div className="d-flex justify-content-end mt-4">
										<button className="btn btn-success btn-sm" onClick={resetAll}>
											Create Another
										</button>
									</div>
								</div>
							) : null}
						</div>
					</div>

					<div className="col-12 col-lg-4">
						<div className="p-3" style={{ background: 'rgba(15, 25, 50, 0.75)', border: '1px solid rgba(0, 255, 200, 0.25)', borderRadius: 16 }}>
							<div style={{ color: '#00FFD4', fontWeight: 900 }}>Current selection</div>
							<div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10, fontWeight: 800 }}>
								{selectedPlan ? `${selectedPlan.planName || selectedPlan.name} (${PLAN_TYPE_LABEL[selectedPlan.type] || selectedPlan.type})` : '—'}
							</div>
							<div style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 13 }}>
								Offline cash registrations do not add Razorpay fee/GST.
							</div>

								<div style={{ height: 1, background: 'rgba(255,255,255,0.10)', margin: '14px 0' }} />

								<div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>Summary</div>
								<div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
									{selectedPlan?.type === 'public' ? (
										<div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
											People: <span style={{ color: '#fff', fontWeight: 800 }}>{peopleCount ?? '—'}</span>
										</div>
									) : null}

									{selectedPlan?.categoryRequired ? (
										<div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
											Category: <span style={{ color: '#fff', fontWeight: 800 }}>{CATEGORY_LABEL[selection.category] || selection.category}</span>
										</div>
									) : null}

									{selectedPlan?.type === 'yearly' && (selectedPlan.addOns?.coachingAddOnMonthly || 0) > 0 ? (
										<div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
											Coaching add-on: <span style={{ color: '#fff', fontWeight: 800 }}>{selection.coachingAddOn ? 'Yes' : 'No'}</span>
										</div>
									) : null}

									{computedSubtotal != null ? (
										<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
											<div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Amount</div>
											<div style={{ color: '#fff', fontWeight: 900 }}>{formatInr(computedSubtotal)}</div>
										</div>
									) : (
										<div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
											Select valid options to calculate amount.
										</div>
									)}

									<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
										<div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Total to collect</div>
										<div style={{ color: '#00FFD4', fontWeight: 900, fontSize: 18 }}>{formatInr(computedTotal)}</div>
									</div>
								</div>
						</div>
					</div>
				</div>
			</div>
        </div>
    );
};

export default OfflineMembership
