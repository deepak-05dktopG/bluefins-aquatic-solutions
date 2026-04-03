/**
 * What it is: Admin page for managing membership plans.
 * Non-tech note: Create, edit, activate/deactivate, and delete plans from the UI.
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Swal from 'sweetalert2';
import AdminNavbar from '../../components/adminPanel/AdminNavbar';

const PLAN_TYPES = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'summer', label: 'Summer' },
    { value: 'family', label: 'Family' },
    { value: 'public', label: 'Public / Per Session' },
];

const TYPE_COLORS = {
    monthly: '#3b82f6',
    yearly: '#8b5cf6',
    summer: '#f59e0b',
    family: '#10b981',
    public: '#ec4899',
};

const emptyForm = {
    planName: '',
    type: 'monthly',
    durationInDays: '',
    durationInMinutes: '',
    basePrice: '',
    originalPrice: '',
    maxMembers: '',
    isRecurring: false,
    isActive: true,
    categoryRequired: false,
};

const ManagePlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [saving, setSaving] = useState(false);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/admin/plans');
            setPlans(data.data || []);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const openCreateModal = () => {
        setEditingPlan(null);
        setForm({ ...emptyForm });
        setShowModal(true);
    };

    const openEditModal = (plan) => {
        setEditingPlan(plan);
        setForm({
            planName: plan.planName || '',
            type: plan.type || 'monthly',
            durationInDays: plan.durationInDays || '',
            durationInMinutes: plan.durationInMinutes || '',
            basePrice: plan.basePrice ?? '',
            originalPrice: plan.originalPrice || '',
            maxMembers: plan.maxMembers || '',
            isRecurring: plan.isRecurring ?? false,
            isActive: plan.isActive ?? true,
            categoryRequired: plan.categoryRequired ?? false,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.planName.trim()) return Swal.fire('Error', 'Plan name is required.', 'error');
        if (!form.basePrice && form.basePrice !== 0) return Swal.fire('Error', 'Base price is required.', 'error');

        setSaving(true);
        try {
            const payload = {
                ...form,
                planName: form.planName.trim(),
                basePrice: Number(form.basePrice),
                durationInDays: form.durationInDays ? Number(form.durationInDays) : undefined,
                durationInMinutes: form.durationInMinutes ? Number(form.durationInMinutes) : undefined,
                originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
                maxMembers: form.maxMembers ? Number(form.maxMembers) : undefined,
            };

            if (editingPlan) {
                await api.patch(`/admin/plans/${editingPlan._id}`, payload);
                Swal.fire('Updated!', `"${form.planName}" has been updated.`, 'success');
            } else {
                await api.post('/admin/plans', payload);
                Swal.fire('Created!', `"${form.planName}" has been created.`, 'success');
            }
            setShowModal(false);
            fetchPlans();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to save plan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (plan) => {
        try {
            await api.patch(`/admin/plans/${plan._id}`, { isActive: !plan.isActive });
            fetchPlans();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to update.', 'error');
        }
    };

    const handleDelete = async (plan) => {
        const result = await Swal.fire({
            title: `Delete "${plan.planName}"?`,
            text: plan.memberCount > 0
                ? `⚠️ This plan has ${plan.memberCount} enrolled member(s). You cannot delete it — only deactivate.`
                : 'This action cannot be undone.',
            icon: plan.memberCount > 0 ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: plan.memberCount > 0 ? 'OK' : 'Yes, Delete',
            showConfirmButton: plan.memberCount === 0,
        });

        if (result.isConfirmed && plan.memberCount === 0) {
            try {
                await api.delete(`/admin/plans/${plan._id}`);
                Swal.fire('Deleted!', `"${plan.planName}" has been removed.`, 'success');
                fetchPlans();
            } catch (err) {
                Swal.fire('Error', err.response?.data?.message || 'Failed to delete plan.', 'error');
            }
        }
    };

    const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

    // ─── Styles ──────────────────────────────────────────────────────────
    const pageStyle = { minHeight: '100vh', background: '#0a0f1a', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' };
    const containerStyle = { padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1200px', margin: '0 auto' };
    const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' };
    const titleStyle = { fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, background: 'linear-gradient(135deg, #00FFD4 0%, #0099FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 };
    const createBtnStyle = { padding: '12px 28px', background: 'linear-gradient(135deg, #00FFD4, #0099FF)', color: '#0a0f1a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
    const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', transition: 'border-color 0.3s' };
    const badgeStyle = (color) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', background: `${color}22`, color, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' });
    const toggleStyle = (active) => ({ width: '44px', height: '24px', borderRadius: '12px', background: active ? '#22c55e' : '#374151', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' });
    const toggleDotStyle = (active) => ({ position: 'absolute', top: '3px', left: active ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.3s' });

    // Modal overlay
    const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' };
    const modalStyle = { background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: 'clamp(20px, 4vw, 32px)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' };
    const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
    const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

    return (
        <div style={pageStyle}>
            <AdminNavbar />
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Manage Plans</h1>
                    <button onClick={openCreateModal} style={createBtnStyle}>+ New Plan</button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                    {[
                        { label: 'Total Plans', value: plans.length, color: '#3b82f6' },
                        { label: 'Active', value: plans.filter(p => p.isActive).length, color: '#22c55e' },
                        { label: 'Inactive', value: plans.filter(p => !p.isActive).length, color: '#f59e0b' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginTop: '4px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Plan Cards */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>No plans yet. Click "+ New Plan" to create one.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {plans.map((plan) => (
                            <div key={plan._id} style={{ ...cardStyle, opacity: plan.isActive ? 1 : 0.5 }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '17px', fontWeight: 800 }}>{plan.planName}</span>
                                        <span style={badgeStyle(TYPE_COLORS[plan.type] || '#64748b')}>{plan.type}</span>
                                        {!plan.isActive && <span style={badgeStyle('#ef4444')}>Inactive</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: '#94a3b8' }}>
                                        <span>💰 {formatPrice(plan.basePrice)}</span>
                                        {plan.durationInDays && <span>📅 {plan.durationInDays} days</span>}
                                        {plan.durationInMinutes && <span>⏱️ {plan.durationInMinutes} mins</span>}
                                        {plan.maxMembers && <span>👥 Max {plan.maxMembers}</span>}
                                        <span>👤 {plan.memberCount || 0} enrolled</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* Active Toggle */}
                                    <button onClick={() => handleToggleActive(plan)} style={toggleStyle(plan.isActive)} title={plan.isActive ? 'Deactivate' : 'Activate'}>
                                        <div style={toggleDotStyle(plan.isActive)} />
                                    </button>

                                    {/* Edit */}
                                    <button onClick={() => openEditModal(plan)} style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                        Edit
                                    </button>

                                    {/* Delete */}
                                    <button onClick={() => handleDelete(plan)} style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div style={overlayStyle} onClick={() => setShowModal(false)}>
                    <div style={modalStyle} onClick={e => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 24px 0', fontSize: '22px', fontWeight: 900, color: '#f1f5f9' }}>
                            {editingPlan ? `Edit: ${editingPlan.planName}` : 'Create New Plan'}
                        </h2>

                        {/* Plan Name */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Plan Name *</label>
                            <input style={inputStyle} value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} placeholder="e.g. Monthly Membership" />
                        </div>

                        {/* Type + Price Row */}
                        <div style={{ ...rowStyle, marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Type *</label>
                                <select style={{ ...inputStyle, appearance: 'auto' }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {PLAN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Base Price (₹) *</label>
                                <input type="number" style={inputStyle} value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} placeholder="3000" />
                            </div>
                        </div>

                        {/* Duration Row */}
                        <div style={{ ...rowStyle, marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Duration (Days)</label>
                                <input type="number" style={inputStyle} value={form.durationInDays} onChange={e => setForm({ ...form, durationInDays: e.target.value })} placeholder="30" />
                            </div>
                            <div>
                                <label style={labelStyle}>Duration (Minutes)</label>
                                <input type="number" style={inputStyle} value={form.durationInMinutes} onChange={e => setForm({ ...form, durationInMinutes: e.target.value })} placeholder="60" />
                            </div>
                        </div>

                        {/* Optional Fields Row */}
                        <div style={{ ...rowStyle, marginBottom: '16px' }}>
                            <div>
                                <label style={labelStyle}>Original Price (₹)</label>
                                <input type="number" style={inputStyle} value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })} placeholder="Show as strikethrough" />
                            </div>
                            <div>
                                <label style={labelStyle}>Max Members</label>
                                <input type="number" style={inputStyle} value={form.maxMembers} onChange={e => setForm({ ...form, maxMembers: e.target.value })} placeholder="For family plans" />
                            </div>
                        </div>

                        {/* Toggles */}
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                            {[
                                { label: 'Active', key: 'isActive' },
                                { label: 'Recurring', key: 'isRecurring' },
                            ].map(toggle => (
                                <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
                                    <button type="button" onClick={() => setForm({ ...form, [toggle.key]: !form[toggle.key] })} style={toggleStyle(form[toggle.key])}>
                                        <div style={toggleDotStyle(form[toggle.key])} />
                                    </button>
                                    {toggle.label}
                                </label>
                            ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #00FFD4, #0099FF)', color: '#0a0f1a', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                                {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePlans;
