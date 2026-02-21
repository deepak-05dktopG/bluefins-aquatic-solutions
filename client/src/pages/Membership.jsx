import { adminFetch, isAdminAuthenticated } from '../utils/adminAuth'
import React, { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import { downloadMemberIdCard } from '../utils/idCard'

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api'

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const existing = document.getElementById('razorpay-checkout-js')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.id = 'razorpay-checkout-js'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const safeReadJson = async (res) => {
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
}

const PLAN_TYPE_LABEL = {
  summer: 'Summer Camp',
  monthly: 'Monthly Training',
  yearly: 'Individual (1 Year)',
  family: 'Family (1 Year)',
  public: 'Public Entry (Per Session)',
}

const CATEGORY_LABEL = {
  infant: 'Infant (2–6)',
  kids: 'Kids (6–18)',
  adult: 'Adult (18+)',
}

const emptyMember = { name: '', phone: '', age: '', gender: 'other' }
const emptyFamilyMember = { name: '', phone: '', age: '', gender: 'other' }

const STEP = {
  PLAN: 1,
  DETAILS: 2,
  CONFIRM: 3,
  DONE: 4,
}

const normalizeText = (v) => (v == null ? '' : String(v)).trim()

const normalizePhone10 = (v) => {
  const raw = normalizeText(v)
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

const isValidPhone10 = (v) => /^\d{10}$/.test(String(v || ''))

const normalizeGender = (v) => {
  const raw = normalizeText(v)
  if (!raw) return 'other'
  const g = raw.toLowerCase()
  if (g === 'male' || g === 'female' || g === 'other') return g
  return null
}

const normalizeAge = (v) => {
  if (v == null || v === '') return { ok: true, age: undefined }
  const n = Number(v)
  if (!Number.isFinite(n)) return { ok: false, message: 'Age must be a number' }
  if (n < 1 || n > 120) return { ok: false, message: 'Age must be between 1 and 120' }
  return { ok: true, age: Math.floor(n) }
}

const paymentTypeLabel = (provider) => {
  const p = String(provider || '').toLowerCase()
  if (p === 'razorpay') return 'Online (Razorpay)'
  if (p === 'cash' || p === 'mock') return 'Cash (Offline)'
  if (!p) return '—'
  return p
}

const Membership = () => {
  const [step, setStep] = useState(STEP.PLAN)

  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [paymentCharges, setPaymentCharges] = useState({
    commissionPct: 0,
    commissionFlatInr: 0,
    gstPct: 0,
    gstAppliesOn: 'commission',
  })

  const [testAmountInr, setTestAmountInr] = useState(null)

  const [member, setMember] = useState(emptyMember)
  const [selection, setSelection] = useState({
    category: 'kids',
    coachingAddOn: false,
    quantity: 1,
    publicSlot: { date: '', startTime: '10:00', endTime: '' },
  })

  const [familyMembers, setFamilyMembers] = useState([
    emptyFamilyMember,
  ])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const isAdmin = useMemo(() => {
    return isAdminAuthenticated()
  }, [])

  const selectedPlan = useMemo(() => plans.find((p) => p._id === selectedPlanId) || null, [plans, selectedPlanId])

  const planLabel = (p) => {
    const name = p?.planName || p?.name || 'Membership Plan'
    const type = p?.type || 'monthly'
    return `${name} (${PLAN_TYPE_LABEL[type] || type})`
  }

  const computedSubtotal = useMemo(() => {
    if (testAmountInr != null) return Number(testAmountInr)
    if (!selectedPlan) return null

    if (selectedPlan.type === 'public') {
      const qty = Number(selection.quantity || 1)
      return (selectedPlan.basePrice || 0) * (Number.isFinite(qty) && qty > 0 ? qty : 1)
    }

    if (selectedPlan.categoryRequired) {
      const category = selection.category
      const row = (selectedPlan.categoryPrices || []).find((x) => x.category === category)
      return row ? row.price : null
    }

    let base = selectedPlan.basePrice || 0
    if (selectedPlan.type === 'yearly' && selection.coachingAddOn) {
      base += selectedPlan.addOns?.coachingAddOnMonthly || 0
    }

    return base
  }, [selectedPlan, selection, testAmountInr])

  const computedPricing = useMemo(() => {
    if (testAmountInr != null) {
      const forced = Number(testAmountInr)
      if (!Number.isFinite(forced) || forced <= 0) return null
      return { subtotal: forced, commission: 0, gst: 0, total: forced }
    }
    if (computedSubtotal == null) return null

    const subtotal = Number(computedSubtotal)
    if (!Number.isFinite(subtotal)) return null

    const commissionPct = Math.max(0, Number(paymentCharges?.commissionPct || 0))
    const commissionFlatInr = Math.max(0, Number(paymentCharges?.commissionFlatInr || 0))
    const gstPct = Math.max(0, Number(paymentCharges?.gstPct || 0))

    const round2 = (v) => Math.round((Number(v) + Number.EPSILON) * 100) / 100
    const commission = round2(subtotal * (commissionPct / 100) + commissionFlatInr)
    const gst = round2(commission * (gstPct / 100))
    const total = round2(subtotal + commission + gst)

    return { subtotal: round2(subtotal), commission, gst, total }
  }, [computedSubtotal, paymentCharges, testAmountInr])

  const computedAmount = useMemo(() => {
    return computedPricing?.total ?? computedSubtotal
  }, [computedPricing, computedSubtotal])

  const computedExpiryPreview = useMemo(() => {
    if (!selectedPlan) return null

    if (selectedPlan.type === 'public') {
      if (!selection.publicSlot?.date || !selection.publicSlot?.startTime) return null
      const start = new Date(`${selection.publicSlot.date}T${selection.publicSlot.startTime}:00`)
      const end = selection.publicSlot.endTime
        ? new Date(`${selection.publicSlot.date}T${selection.publicSlot.endTime}:00`)
        : new Date(start.getTime() + 60 * 60 * 1000)
      return end
    }

    const days = selectedPlan.durationInDays || 30
    const end = new Date()
    end.setDate(end.getDate() + days)
    return end
  }, [selectedPlan, selection.publicSlot])

  const fetchPlans = async () => {
    setError('')
    setLoadingPlans(true)
    try {
      const res = await fetch(`${apiBase}/membership/plans?isActive=true`)
      const parsed = await safeReadJson(res)
      if (!parsed.ok) throw new Error(parsed.error)
      const data = parsed.data
      if (!res.ok) throw new Error(data?.message || `Failed to load plans (${res.status})`)
      if (data?.meta?.paymentCharges) {
        setPaymentCharges((prev) => ({ ...prev, ...data.meta.paymentCharges }))
      }
      if (typeof data?.meta?.testAmountInr === 'number' && Number.isFinite(data.meta.testAmountInr)) {
        setTestAmountInr(data.meta.testAmountInr)
      } else {
        setTestAmountInr(null)
      }
      const list = data?.data || []
      const typeOrder = ['public', 'monthly', 'summer', 'yearly', 'family']
      const sorted = [...list].sort((a, b) => {
        const ai = typeOrder.indexOf(a?.type)
        const bi = typeOrder.indexOf(b?.type)
        const ao = ai === -1 ? typeOrder.length : ai
        const bo = bi === -1 ? typeOrder.length : bi
        if (ao !== bo) return ao - bo
        const ap = Number(a?.basePrice ?? a?.price ?? 0)
        const bp = Number(b?.basePrice ?? b?.price ?? 0)
        if (ap !== bp) return ap - bp
        const an = String(a?.planName ?? a?.name ?? '')
        const bn = String(b?.planName ?? b?.name ?? '')
        return an.localeCompare(bn)
      })

      setPlans(sorted)
      if (sorted.length) {
        const hasSelected = Boolean(selectedPlanId) && sorted.some((p) => p._id === selectedPlanId)
        if (!hasSelected) {
          const firstPublic = sorted.find((p) => p?.type === 'public')
          setSelectedPlanId((firstPublic || sorted[0])._id)
        }
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingPlans(false)
    }
  }

  const seedPlans = async () => {
    setError('')
    setBusy(true)
    try {
      const res = await adminFetch(`${apiBase}/membership/plans/seed`, { method: 'POST' })
      const parsed = await safeReadJson(res)
      if (!parsed.ok) throw new Error(parsed.error)
      const data = parsed.data
      if (!res.ok) throw new Error(data?.message || `Failed to seed plans (${res.status})`)
      await fetchPlans()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setResult(null)
    setError('')
    setStep(STEP.PLAN)
  }, [selectedPlanId])

  useEffect(() => {
    if (selectedPlan?.type !== 'family') {
      setFamilyMembers([emptyFamilyMember])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan?.type])

  useEffect(() => {
    if (!plans.length) return
    if (!selectedPlanId || !plans.some((p) => p._id === selectedPlanId)) {
      const firstPublic = plans.find((p) => p?.type === 'public')
      setSelectedPlanId((firstPublic || plans[0])._id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans])

  useEffect(() => {
    if (result) setStep(STEP.DONE)
  }, [result])

  const validateStep = (targetStep) => {
    if (targetStep >= STEP.DETAILS) {
      if (!selectedPlan) return 'Select a plan to continue'
    }

    if (targetStep >= STEP.CONFIRM) {
      if (!selectedPlan) return 'Select a plan to continue'

      if (selectedPlan.type === 'family') {
        const contactName = normalizeText(member.name)
        const contactPhone = normalizePhone10(member.phone)
        if (!contactName) return 'Contact name is required'
        if (!contactPhone) return 'Contact phone is required'
        if (!isValidPhone10(contactPhone)) return 'Contact phone must be a valid 10-digit number'

        const list = Array.isArray(familyMembers) ? familyMembers : []
        if (!list.length) return 'Add at least 1 family member'
        if (selectedPlan.maxMembers && list.length > selectedPlan.maxMembers) {
          return `Maximum ${selectedPlan.maxMembers} members allowed for this plan`
        }

        for (const fm of list) {
          const n = normalizeText(fm?.name)
          if (!n) return 'All family members require a name'
          const p = normalizePhone10(fm?.phone)
          if (p && !isValidPhone10(p)) return 'Family member phone must be a valid 10-digit number'
          const g = normalizeGender(fm?.gender)
          if (g === null) return 'Family member gender must be Male/Female/Other'
          const a = normalizeAge(fm?.age)
          if (!a.ok) return `Family member ${a.message}`
        }
      } else {
        const name = normalizeText(member.name)
        const phone = normalizePhone10(member.phone)
        if (!name) return 'Name is required'
        if (!phone) return 'Phone is required'
        if (!isValidPhone10(phone)) return 'Phone must be a valid 10-digit number'
        const g = normalizeGender(member.gender)
        if (g === null) return 'Gender must be Male/Female/Other'
        const a = normalizeAge(member.age)
        if (!a.ok) return a.message
      }

      if (selectedPlan.categoryRequired) {
        if (!selection.category) return 'Select a category'
        const allowed = (selectedPlan.categoryPrices || []).map((x) => String(x?.category || '').toLowerCase())
        if (allowed.length && !allowed.includes(String(selection.category).toLowerCase())) return 'Select a valid category'
      }

      if (selectedPlan.type === 'public') {
        if (!selection.publicSlot?.date) return 'Select a date'
        if (!selection.publicSlot?.startTime) return 'Select a start time'
        const qty = Number(selection.quantity)
        if (!Number.isFinite(qty) || qty < 1) return 'People must be at least 1'
      }

      if (computedAmount == null || !Number.isFinite(Number(computedAmount)) || Number(computedAmount) <= 0) {
        return 'Unable to calculate amount. Please review your selections.'
      }
    }

    return ''
  }

  const goNext = () => {
    const next = Math.min(STEP.CONFIRM, step + 1)
    const err = validateStep(next)
    if (err) {
      setError(err)
      return
    }
    setError('')
    setStep(next)
  }

  const goBack = () => {
    setError('')
    setStep(Math.max(STEP.PLAN, step - 1))
  }

  const stepPercent = useMemo(() => {
    const clamped = Math.min(Math.max(step, STEP.PLAN), STEP.DONE)
    return ((clamped - 1) / 3) * 100
  }, [step])

  const addFamilyMemberRow = () => {
    if (!selectedPlan?.maxMembers) {
      setFamilyMembers((prev) => [...prev, { ...emptyFamilyMember }])
      return
    }
    if (familyMembers.length >= selectedPlan.maxMembers) return
    setFamilyMembers((prev) => [...prev, { ...emptyFamilyMember }])
  }

  const removeFamilyMemberRow = (idx) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== idx))
  }

  const submitRegistration = async () => {
    const preErr = validateStep(STEP.CONFIRM)
    if (preErr) {
      setError(preErr)
      return
    }

    setError('')
    setBusy(true)

    try {
      if (!selectedPlan) throw new Error('Select a plan')

      const okScript = await loadRazorpay()
      if (!okScript) throw new Error('Payment system failed to load. Please try again.')

      const normalizedMember = {
        ...member,
        name: normalizeText(member?.name),
        phone: normalizePhone10(member?.phone),
        age: member?.age ? Number(member.age) : undefined,
        gender: (normalizeGender(member?.gender) || 'other'),
      }

      const payload = {
        planId: selectedPlan._id,
        member: normalizedMember,
        selection,
        familyMembers:
          selectedPlan.type === 'family'
            ? familyMembers.map((m) => ({
                name: normalizeText(m?.name),
                phone: normalizePhone10(m?.phone),
                age: m?.age ? Number(m.age) : undefined,
                gender: (normalizeGender(m?.gender) || 'other'),
              }))
            : undefined,
      }

      const resOrder = await fetch(`${apiBase}/payments/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const parsedOrder = await safeReadJson(resOrder)
      if (!parsedOrder.ok) throw new Error(parsedOrder.error)
      const orderJson = parsedOrder.data
      if (!resOrder.ok) throw new Error(orderJson?.message || `Failed to create payment order (${resOrder.status})`)

      const order = orderJson?.data
      if (!order?.orderId || !order?.keyId) throw new Error('Invalid payment order response')

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amountPaise,
        currency: order.currency || 'INR',
        name: 'Bluefins Aquatic Solutions',
        description: order?.plan?.planName || 'Membership',
        order_id: order.orderId,
        prefill: {
          name: member?.name || '',
          contact: member?.phone || '',
        },
        notes: {
          planId: selectedPlan._id,
          paymentDbId: String(order.paymentDbId || ''),
        },
        handler: async (response) => {
          try {
            const resVerify = await fetch(`${apiBase}/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })
            const parsedVerify = await safeReadJson(resVerify)
            if (!parsedVerify.ok) throw new Error(parsedVerify.error)
            const verifyJson = parsedVerify.data
            if (!resVerify.ok) throw new Error(verifyJson?.message || `Payment verification failed (${resVerify.status})`)

            setResult(verifyJson?.data)
            setStep(STEP.DONE)
            if (selectedPlan.type !== 'family') setMember(emptyMember)
          } catch (e) {
            setError(e.message)
          } finally {
            setBusy(false)
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false)
          },
        },
        theme: { color: '#0077B6' },
      })

      rzp.on('payment.failed', (resp) => {
        const msg = resp?.error?.description || resp?.error?.reason || 'Payment failed'
        setError(msg)
        setBusy(false)
      })

      rzp.open()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const pageBg = {
    minHeight: '100vh',
    background: 'var(--gradient-primary)',
  }

  const glassCard = {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 14,
    backdropFilter: 'blur(10px)',
  }

  const goToStep = (target) => {
    if (target === STEP.DONE && !result) return
    if (target > step) {
      const err = validateStep(target)
      if (err) {
        setError(err)
        return
      }
    }
    setError('')
    setStep(target)
  }

  const StepTab = ({ n, label }) => {
    const active = step === n
    const enabled = n <= step || (n === STEP.DONE && Boolean(result))
    return (
      <button
        type="button"
        className={`membership-step-tab ${active ? 'membership-step-tab--active' : ''}`}
        onClick={() => (enabled ? goToStep(n) : null)}
        disabled={!enabled}
      >
        <span className="membership-step-num">{n}</span>
        <span className="membership-step-label">{label}</span>
      </button>
    )
  }

  const planCardPrice = (p) => {
    if (!p) return '—'
    if (p.categoryRequired) {
      const prices = (p.categoryPrices || [])
        .map((x) => Number(x?.price))
        .filter((x) => Number.isFinite(x) && x > 0)
      const min = prices.length ? Math.min(...prices) : null
      return min == null ? '—' : `From ₹${min}`
    }
    if (p.type === 'public') {
      const base = Number(p.basePrice || 0)
      return Number.isFinite(base) ? `₹${base} / person` : '—'
    }
    const base = Number(p.basePrice || 0)
    return Number.isFinite(base) ? `₹${base}` : '—'
  }

  const planCardMeta = (p) => {
    if (!p) return ''
    if (p.type === 'public') return `${p.durationInMinutes || 60} min`
    if (p.durationInDays) return `${p.durationInDays} days`
    return ''
  }

  const renderCreatedMembers = () => {
    if (!result) return null
    const list = Array.isArray(result.members) ? result.members : []
    if (!list.length) return null

    return (
      <div className="mt-3">
        <div style={{ color: '#fff', fontWeight: 900, marginBottom: 8 }}>Your ID cards</div>
        <div className="row g-2">
          {list.map((m) => (
            <div key={m._id} className="col-12">
              <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 10 }}>
                <div className="d-flex align-items-start justify-content-between gap-2 flex-wrap">
                  <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>{m.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{m.phone}</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                      Customer ID: BF-{String(m._id).slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-light btn-sm"
                    type="button"
                    disabled={!m.qrCode}
                    onClick={async () => {
                      try {
                        await downloadMemberIdCard({
                          name: m.name,
                          memberId: m._id,
                          qrDataUrl: m.qrCode,
                          planName: result?.plan?.planName,
                          joinDate: m.joinDate,
                          expiryDate: m.expiryDate,
                        })
                      } catch (e) {
                        window.alert(e?.message || 'Failed to download ID card')
                      }
                    }}
                  >
                    Download ID Card
                  </button>
                </div>

                {m.qrCode ? (
                  <div className="mt-2" style={{ background: '#fff', borderRadius: 12, padding: 8, maxWidth: 200 }}>
                    <img src={m.qrCode} alt="Member QR" style={{ width: '100%', display: 'block' }} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={pageBg} className="membership-page">
      <Navbar />

      <div className="container-fluid membership-container">
        <div className="membership-grid">
          <div className="membership-main">
            <div className="p-3 p-md-4 membership-shell" style={glassCard}>
              <div className="membership-header">
                <div>
                  <h4 className="membership-title">Membership</h4>
                  <div className="membership-subtitle">
                    Choose a plan and pay securely. Your membership and QR ID card are generated after successful payment.
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-light btn-sm" onClick={fetchPlans} disabled={loadingPlans || busy}>
                    Refresh
                  </button>
                  {isAdmin ? (
                    <button className="btn btn-warning btn-sm" onClick={seedPlans} disabled={busy}>
                      Seed Plans
                    </button>
                  ) : null}
                </div>
              </div>

              {error ? (
                <div className="alert alert-danger mt-3" role="alert">
                  {error}
                </div>
              ) : null}

              <div className="membership-step-tabs mt-3">
                <StepTab n={STEP.PLAN} label="Plan" />
                <StepTab n={STEP.DETAILS} label="Details" />
                <StepTab n={STEP.CONFIRM} label="Pay" />
                <StepTab n={STEP.DONE} label="Done" />
              </div>

              <div className="membership-progress mt-3">
                <div className="membership-progress-bar" style={{ width: `${stepPercent}%` }} />
              </div>

              <div className="membership-main-body mt-3">
                  {step === STEP.PLAN ? (
                    <div className="membership-card membership-section">
                      <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Choose a plan</h6>
                      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 6 }}>
                        Public Entry plans appear first.
                      </div>

                      {loadingPlans ? (
                        <div style={{ color: '#fff' }}>Loading…</div>
                      ) : plans.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                          No plans in DB. Click <b>Seed Official Plans</b>.
                        </div>
                      ) : null}

                      {plans.length ? (
                        <div className="membership-plan-grid mt-3">
                          {plans.map((p) => {
                            const isSelected = p._id === selectedPlanId
                            const label = p.planName || p.name || 'Membership Plan'
                            const typeLabel = PLAN_TYPE_LABEL[p.type] || p.type || 'Plan'

                            return (
                              <button
                                key={p._id}
                                type="button"
                                className={`membership-plan-card ${isSelected ? 'membership-plan-card--active' : ''}`}
                                onClick={() => setSelectedPlanId(p._id)}
                              >
                                <div className="membership-plan-top">
                                  <div>
                                    <div className="membership-plan-name">{label}</div>
                                    <div className="membership-plan-sub">
                                      {typeLabel}{planCardMeta(p) ? ` • ${planCardMeta(p)}` : ''}
                                    </div>
                                  </div>
                                  <div className="membership-plan-price">{planCardPrice(p)}</div>
                                </div>

                                {p.type === 'public' ? (
                                  <div className="membership-plan-tag">Public Entry</div>
                                ) : p.type === 'family' ? (
                                  <div className="membership-plan-tag">Family</div>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}

                      {selectedPlan ? (
                        <div className="membership-subcard mt-3">
                          <div className="membership-subcard-title">Plan options</div>

                          {selectedPlan?.categoryRequired ? (
                            <div className="mt-2">
                              <label className="form-label" style={{ color: '#fff' }}>
                                Category
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={selection.category}
                                onChange={(e) => setSelection({ ...selection, category: e.target.value })}
                              >
                                <option value="infant">{CATEGORY_LABEL.infant}</option>
                                <option value="kids">{CATEGORY_LABEL.kids}</option>
                                <option value="adult">{CATEGORY_LABEL.adult}</option>
                              </select>
                            </div>
                          ) : null}

                          {selectedPlan?.type === 'yearly' && (selectedPlan.addOns?.coachingAddOnMonthly || 0) > 0 ? (
                            <div className="form-check mt-3" style={{ color: '#fff' }}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={Boolean(selection.coachingAddOn)}
                                onChange={(e) => setSelection({ ...selection, coachingAddOn: e.target.checked })}
                                id="coachingAddOn"
                              />
                              <label className="form-check-label" htmlFor="coachingAddOn">
                                Add coaching add-on (₹{selectedPlan.addOns?.coachingAddOnMonthly || 0})
                              </label>
                            </div>
                          ) : null}

                          {selectedPlan?.type === 'public' ? (
                            <div className="mt-3">
                              <div className="row g-2">
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Date
                                  </label>
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={selection.publicSlot.date}
                                    onChange={(e) =>
                                      setSelection({
                                        ...selection,
                                        publicSlot: { ...selection.publicSlot, date: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    People
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    className="form-control form-control-sm"
                                    value={selection.quantity}
                                    onChange={(e) => setSelection({ ...selection, quantity: e.target.value })}
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    className="form-control form-control-sm"
                                    value={selection.publicSlot.startTime}
                                    onChange={(e) =>
                                      setSelection({
                                        ...selection,
                                        publicSlot: { ...selection.publicSlot, startTime: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    End Time (optional)
                                  </label>
                                  <input
                                    type="time"
                                    className="form-control form-control-sm"
                                    value={selection.publicSlot.endTime}
                                    onChange={(e) =>
                                      setSelection({
                                        ...selection,
                                        publicSlot: { ...selection.publicSlot, endTime: e.target.value },
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div className="mt-2" style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12 }}>
                                Entry window: {selectedPlan.publicEntryWindow?.startTime || '—'} to{' '}
                                {selectedPlan.publicEntryWindow?.endTime || '—'}. If End Time is empty, it defaults to +1 hour.
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                          className="btn btn-outline-light btn-sm"
                          onClick={goNext}
                          disabled={busy || loadingPlans || plans.length === 0}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === STEP.DETAILS ? (
                    <div className="membership-card membership-section">
                      <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Member details</h6>
                      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, marginTop: 6 }}>
                        Enter details exactly as you want them on the ID card.
                      </div>

                      {selectedPlan?.type === 'family' ? (
                        <>
                          <div className="mb-2">
                            <label className="form-label" style={{ color: '#fff' }}>
                              Contact Name (payer)
                            </label>
                            <input
                              className="form-control form-control-sm"
                              value={member.name}
                              onChange={(e) => setMember({ ...member, name: e.target.value })}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label" style={{ color: '#fff' }}>
                              Contact Phone (payer)
                            </label>
                            <input
                              className="form-control form-control-sm"
                              value={member.phone}
                              onChange={(e) => setMember({ ...member, phone: e.target.value })}
                            />
                          </div>

                          {familyMembers.map((fm, idx) => (
                            <div
                              key={idx}
                              className="p-2 mb-2"
                              style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <div style={{ color: '#fff', fontWeight: 700 }}>Member {idx + 1}</div>
                                {familyMembers.length > 1 ? (
                                  <button className="btn btn-sm btn-outline-light" onClick={() => removeFamilyMemberRow(idx)}>
                                    Remove
                                  </button>
                                ) : null}
                              </div>

                              <div className="row g-2 mt-1">
                                <div className="col-12">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Name
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    value={fm.name}
                                    onChange={(e) =>
                                      setFamilyMembers((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-12">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Phone (optional)
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    value={fm.phone || ''}
                                    onChange={(e) =>
                                      setFamilyMembers((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, phone: e.target.value } : x))
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Age
                                  </label>
                                  <input
                                    className="form-control form-control-sm"
                                    value={fm.age}
                                    onChange={(e) =>
                                      setFamilyMembers((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, age: e.target.value } : x))
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-6">
                                  <label className="form-label" style={{ color: '#fff' }}>
                                    Gender
                                  </label>
                                  <select
                                    className="form-select form-select-sm"
                                    value={fm.gender}
                                    onChange={(e) =>
                                      setFamilyMembers((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, gender: e.target.value } : x))
                                      )
                                    }
                                  >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            className="btn btn-outline-light btn-sm w-100"
                            onClick={addFamilyMemberRow}
                            disabled={Boolean(selectedPlan?.maxMembers && familyMembers.length >= selectedPlan.maxMembers)}
                          >
                            Add Member
                          </button>

                          {selectedPlan?.maxMembers ? (
                            <div className="mt-2" style={{ color: 'rgba(255,255,255,0.82)' }}>
                              Max {selectedPlan.maxMembers} members
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <>
                          <div className="mb-2">
                            <label className="form-label" style={{ color: '#fff' }}>
                              Name
                            </label>
                            <input
                              className="form-control form-control-sm"
                              value={member.name}
                              onChange={(e) => setMember({ ...member, name: e.target.value })}
                            />
                          </div>

                          <div className="mb-2">
                            <label className="form-label" style={{ color: '#fff' }}>
                              Phone
                            </label>
                            <input
                              className="form-control form-control-sm"
                              value={member.phone}
                              onChange={(e) => setMember({ ...member, phone: e.target.value })}
                            />
                          </div>

                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label" style={{ color: '#fff' }}>
                                Age
                              </label>
                              <input
                                className="form-control form-control-sm"
                                value={member.age}
                                onChange={(e) => setMember({ ...member, age: e.target.value })}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label" style={{ color: '#fff' }}>
                                Gender
                              </label>
                              <select
                                className="form-select form-select-sm"
                                value={member.gender}
                                onChange={(e) => setMember({ ...member, gender: e.target.value })}
                              >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="d-flex justify-content-between gap-2 mt-4">
                        <button className="btn btn-outline-light btn-sm" onClick={goBack} disabled={busy}>
                          Back
                        </button>
                        <button className="btn btn-outline-light btn-sm" onClick={goNext} disabled={busy}>
                          Next
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === STEP.CONFIRM ? (
                    <div className="membership-card membership-section">
                      <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Pay securely</h6>
                      <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 6 }}>
                        You will be redirected to Razorpay to complete the payment.
                      </div>

                      <div className="d-flex justify-content-between gap-2 mt-4">
                        <button className="btn btn-outline-light btn-sm" onClick={goBack} disabled={busy}>
                          Back
                        </button>
                        <button className="btn btn-success btn-sm" onClick={submitRegistration} disabled={busy || !selectedPlan}>
                          Pay {computedAmount == null ? '' : `₹${computedAmount}`}
                        </button>
                      </div>

                      <div className="mt-3" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                        API: <code style={{ color: '#fff' }}>{apiBase}</code>
                      </div>
                    </div>
                  ) : null}

                  {step === STEP.DONE ? (
                    <div className="membership-card">
                      <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Step 4 — Done</h6>
                      <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 6 }}>
                        Payment successful. Your membership and QR ID cards are ready.
                      </div>

                      <div
                        className="mt-3"
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          borderRadius: 12,
                          padding: 12,
                          color: 'rgba(255,255,255,0.88)',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        You can also get your ID card from the admin, or you can download it here.
                      </div>

                      {renderCreatedMembers()}

                      <div className="d-grid mt-3">
                        <button
                          className="btn btn-outline-light btn-sm"
                          onClick={() => {
                            setResult(null)
                            setError('')
                            setStep(STEP.PLAN)
                            setMember(emptyMember)
                            setFamilyMembers([emptyFamilyMember])
                          }}
                          disabled={busy}
                        >
                          Register Another
                        </button>
                      </div>
                    </div>
                  ) : null}
              </div>
            </div>
          </div>

          <div className="membership-aside">
            <div className="membership-aside-inner">
              <div className="membership-card membership-summary">
                <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Summary</h6>

                {!selectedPlan ? (
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 }}>
                    Select a plan to see summary.
                  </div>
                ) : (
                  <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 6 }}>
                    <div>
                      <b>Plan:</b> {selectedPlan.planName}
                    </div>
                    <div>
                      <b>Type:</b> {PLAN_TYPE_LABEL[selectedPlan.type] || selectedPlan.type}
                    </div>
                    {selectedPlan.categoryRequired ? (
                      <div>
                        <b>Category:</b> {CATEGORY_LABEL[selection.category] || selection.category}
                      </div>
                    ) : null}
                    {selectedPlan.type === 'public' ? (
                      <div>
                        <b>Slot:</b>{' '}
                        {selection.publicSlot?.date ? selection.publicSlot.date : '—'}{' '}
                        {selection.publicSlot?.startTime ? selection.publicSlot.startTime : ''}
                      </div>
                    ) : null}
                    {selectedPlan.type === 'family' ? (
                      <div>
                        <b>Members:</b> {familyMembers.length}
                      </div>
                    ) : null}

                    <hr style={{ borderColor: 'rgba(255,255,255,0.25)' }} />

                    <div>
                      <b>Subtotal:</b> {computedPricing?.subtotal == null ? '—' : `₹${computedPricing.subtotal}`}{' '}
                      {selectedPlan.type === 'public' ? '(for selected people)' : ''}
                    </div>

                    {computedPricing && (computedPricing.commission > 0 || computedPricing.gst > 0) ? (
                      <>
                        <div>
                          <b>Payment fee:</b> ₹{computedPricing.commission}
                        </div>
                        <div>
                          <b>GST:</b> ₹{computedPricing.gst}
                        </div>
                        <div style={{ marginTop: 2, fontWeight: 900 }}>
                          <b>Total payable:</b> ₹{computedPricing.total}
                        </div>
                      </>
                    ) : (
                      <div style={{ marginTop: 2, fontWeight: 900 }}>
                        <b>Total payable:</b> {computedAmount == null ? '—' : `₹${computedAmount}`}
                      </div>
                    )}
                    <div>
                      <b>Paid:</b> {result?.payment?.status === 'paid' ? 'Yes' : 'Pending'}
                    </div>
                    <div>
                      <b>Expiry preview:</b> {computedExpiryPreview ? computedExpiryPreview.toLocaleString() : '—'}
                    </div>
                  </div>
                )}
              </div>

              <div className="membership-card">
                <h6 style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Result</h6>

                {!result ? (
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 }}>
                    No registration yet.
                  </div>
                ) : (
                  <>
                    <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 6 }}>
                      <div>
                        <b>Payment:</b> {result.payment?.status} ({result.payment?.paymentId})
                      </div>
                      <div>
                        <b>Payment type:</b> {paymentTypeLabel(result.payment?.provider)}
                      </div>
                      <div>
                        <b>Members created:</b> {result.members?.length || 0}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Membership
