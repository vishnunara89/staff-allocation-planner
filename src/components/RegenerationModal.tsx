'use client';
import { useState } from 'react';

interface RegenerationModalProps {
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

export default function RegenerationModal({ onConfirm, onClose }: RegenerationModalProps) {
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(reason || 'No reason provided');
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', borderRadius: '20px', padding: '2rem',
                width: '100%', maxWidth: '440px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
                animation: 'fadeIn 0.3s ease'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: '#FFF3E0', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem',
                        fontSize: '1.5rem'
                    }}>🔄</div>
                    <h3 style={{
                        margin: 0, fontFamily: 'var(--font-cormorant), serif',
                        fontSize: '1.5rem', color: '#2D2D2D'
                    }}>Regenerate Plan</h3>
                    <p style={{
                        margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#64748b'
                    }}>This will discard the current assignments and generate a fresh plan.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block', fontSize: '0.85rem', fontWeight: 600,
                            color: '#475569', marginBottom: '0.5rem'
                        }}>Why are you regenerating?</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="e.g., Guest count changed, staff unavailable..."
                            rows={3}
                            style={{
                                width: '100%', padding: '0.8rem 1rem', border: '2px solid #e2e8f0',
                                borderRadius: '12px', fontSize: '0.95rem', outline: 'none',
                                resize: 'vertical', transition: 'border-color 0.2s',
                                fontFamily: 'inherit'
                            }}
                            onFocus={e => e.target.style.borderColor = '#7C4C2C'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, padding: '0.75rem', background: 'white',
                            border: '1.5px solid #e2e8f0', borderRadius: '12px',
                            fontWeight: 600, fontSize: '0.9rem', color: '#64748b', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>Cancel</button>
                        <button type="submit" style={{
                            flex: 1, padding: '0.75rem', background: '#E65100',
                            border: 'none', borderRadius: '12px',
                            fontWeight: 600, fontSize: '0.9rem', color: 'white', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>Regenerate</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
