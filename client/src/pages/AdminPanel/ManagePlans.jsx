import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import Swal from 'sweetalert2';
import AdminNavbar from '../../components/adminPanel/AdminNavbar';

const emptyForm = { planName: '', type: 'monthly', basePrice: '', durationInDays: '' };

const ManagePlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/membership/plans'); // Gets all plans
            setPlans(data.data || []);
        } catch (err) {
            console.error('Failed to fetch plans:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                planName: form.planName,
                type: form.type,
                basePrice: Number(form.basePrice),
                durationInDays: form.durationInDays ? Number(form.durationInDays) : undefined
            };

            if (editingId) {
                await api.patch(`/admin/membership/plans/${editingId}`, payload);
                Swal.fire('Updated!', 'Plan updated successfully', 'success');
            } else {
                await api.post('/admin/membership/plans', payload);
                Swal.fire('Added!', 'New plan added', 'success');
            }
            setForm(emptyForm);
            setEditingId(null);
            fetchPlans();
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to save', 'error');
        }
    };

    const handleEdit = (plan) => {
        setEditingId(plan._id);
        setForm({
            planName: plan.planName || '',
            type: plan.type || 'monthly',
            basePrice: plan.basePrice || '',
            durationInDays: plan.durationInDays || ''
        });
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff', fontFamily: 'system-ui' }}>
            <AdminNavbar />
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                <h2 style={{ fontSize: '24px', color: '#00FFD4' }}>Manage Plans</h2>
                
                {/* Add/Edit Form */}
                <form onSubmit={handleSave} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '30px' }}>
                    <input required value={form.planName} onChange={e => setForm({...form, planName: e.target.value})} placeholder="Plan Name (e.g. 1 Month)" style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                    <select required value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#111', color: '#fff' }}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="summer">Summer</option>
                        <option value="family">Family</option>
                        <option value="public">Public / Daily</option>
                    </select>
                    <input required type="number" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} placeholder="Price (₹)" style={{ width: '100px', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                    <input type="number" value={form.durationInDays} onChange={e => setForm({...form, durationInDays: e.target.value})} placeholder="Days" style={{ width: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#111', color: '#fff' }} />
                    
                    <button type="submit" style={{ padding: '10px 20px', background: '#00FFD4', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        {editingId ? 'Update Plan' : 'Add Plan'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ padding: '10px 20px', background: '#444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                    )}
                </form>

                {/* Plan List */}
                {loading ? <p>Loading lists...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.5)', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>Plan Name</th>
                                <th style={{ padding: '15px' }}>Type</th>
                                <th style={{ padding: '15px' }}>Price (₹)</th>
                                <th style={{ padding: '15px' }}>Days</th>
                                <th style={{ padding: '15px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <td style={{ padding: '15px' }}>{p.planName}</td>
                                    <td style={{ padding: '15px', textTransform: 'capitalize' }}>{p.type}</td>
                                    <td style={{ padding: '15px' }}>{p.basePrice}</td>
                                    <td style={{ padding: '15px' }}>{p.durationInDays || '-'}</td>
                                    <td style={{ padding: '15px' }}>
                                        <button onClick={() => handleEdit(p)} style={{ padding: '5px 15px', background: 'transparent', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '5px', cursor: 'pointer' }}>Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ManagePlans;
