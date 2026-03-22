import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { buildMemberIdCardPng } from '../utils/idCard';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

const PublicMemberCard = () => {
    const { memberId } = useParams();
    const [imgSrc, setImgSrc] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMemberAndGenerateCard = async () => {
            try {
                const res = await axios.get(`${apiBase}/membership/public-id/${memberId}`);
                if (res.data.success) {
                    const memberData = res.data.data;
                    
                    try {
                        // Inherit the exact premium aesthetic mapping to the admin download button
                        const dataUrl = await buildMemberIdCardPng({
                            name: memberData.name,
                            memberId: memberData._id,
                            qrDataUrl: memberData.qrCode,
                            planName: memberData.planName,
                            joinDate: memberData.joinDate,
                            expiryDate: memberData.expiryDate,
                        });
                        setImgSrc(dataUrl);
                    } catch (cardErr) {
                        setError('Failed to generate the ID Card visual.');
                        console.error(cardErr);
                    }
                } else {
                    setError('Member not found.');
                }
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load ID card.');
            } finally {
                setLoading(false);
            }
        };
        fetchMemberAndGenerateCard();
    }, [memberId]);

    const handleDownload = () => {
        if (!imgSrc) return;
        const link = document.createElement('a');
        link.download = `BlueFins_ID_${memberId}.png`;
        link.href = imgSrc;
        link.click();
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e27', color: '#00FFD4', fontSize: 24, fontWeight: 'bold' }}>
                Loading ID Card...
            </div>
        );
    }
    
    if (error) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e27', color: '#ff4d4d', fontSize: 24, fontWeight: 'bold' }}>
                {error}
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050714', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
            <div style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Your Digital ID</h1>
                <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: 14 }}>Show this QR code at the reception when entering.</p>
            </div>
            
            <div style={{ background: '#000', borderRadius: 20, padding: 8, boxShadow: '0 20px 50px rgba(0,255,212,0.1)' }}>
                {imgSrc ? (
                    <img 
                        src={imgSrc} 
                        alt="Official Member ID Card"
                        style={{ 
                            width: '100%', 
                            maxWidth: 800, 
                            height: 'auto', 
                            display: 'block', 
                            borderRadius: 12 
                        }} 
                    />
                ) : null}
            </div>
            
            <button 
                onClick={handleDownload}
                style={{ 
                    marginTop: 30, 
                    background: '#00FFD4', 
                    color: '#000', 
                    fontWeight: 900, 
                    border: 'none', 
                    padding: '14px 32px', 
                    borderRadius: 30, 
                    fontSize: 16, 
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(0,255,212,0.3)'
                }}
            >
                📥 Save ID Card Image
            </button>
        </div>
    );
};

export default PublicMemberCard;
