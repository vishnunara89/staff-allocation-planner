'use client';
import { useState, useEffect } from 'react';
import { Freelancer } from '@/types';

interface FreelancerInputProps {
    roleName: string;
    roleId: number;
    onAdd: (freelancer: Freelancer & { role_id: number }) => void;
    onClose: () => void;
}

export default function FreelancerInput({ roleName, roleId, onAdd, onClose }: FreelancerInputProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [skills, setSkills] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [existingFreelancers, setExistingFreelancers] = useState<Freelancer[]>([]);

    useEffect(() => {
        // Fetch existing freelancers
        fetch('/api/freelancers')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setExistingFreelancers(data);
            })
            .catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;

        setSaving(true);
        try {
            const res = await fetch('/api/freelancers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, role: roleName, skills, notes })
            });
            const data = await res.json();
            if (data.success) {
                onAdd({
                    id: data.id,
                    name,
                    phone,
                    role: roleName,
                    skills,
                    notes,
                    role_id: roleId
                });
            }
        } catch (err) {
            console.error('Failed to save freelancer:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSelectExisting = (f: Freelancer) => {
        onAdd({ ...f, role_id: roleId });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'white', borderRadius: '20px', padding: '2rem',
                width: '100%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-cormorant), serif', fontSize: '1.5rem', color: '#2D2D2D' }}>
                        Add Freelancer — {roleName}
                    </h3>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8'
                    }}>✕</button>
                </div>

                {/* Existing Freelancers Section */}
                {existingFreelancers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            Select Existing
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                            {existingFreelancers.map(f => (
                                <button key={f.id} onClick={() => handleSelectExisting(f)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.6rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0',
                                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                                }}>
                                    <div>
                                        <strong style={{ color: '#1e293b', fontSize: '0.9rem' }}>{f.name}</strong>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{f.phone}</span>
                                    </div>
                                    {f.role && <span style={{
                                        fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#EFE8E3',
                                        color: '#7C4C2C', borderRadius: '6px'
                                    }}>{f.role}</span>}
                                </button>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', margin: '1rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>— or add new —</div>
                    </div>
                )}

                {/* New Freelancer Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                            Name *
                        </label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="John Doe" required
                            style={{
                                width: '100%', padding: '0.7rem 1rem', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                            Phone *
                        </label>
                        <input
                            value={phone} onChange={e => setPhone(e.target.value)}
                            placeholder="+971501234567" required
                            style={{
                                width: '100%', padding: '0.7rem 1rem', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                            Skills
                        </label>
                        <input
                            value={skills} onChange={e => setSkills(e.target.value)}
                            placeholder="Fine Dining, Service"
                            style={{
                                width: '100%', padding: '0.7rem 1rem', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                            Notes
                        </label>
                        <textarea
                            value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            rows={2}
                            style={{
                                width: '100%', padding: '0.7rem 1rem', border: '2px solid #e2e8f0',
                                borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                                resize: 'vertical', transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={onClose} style={{
                            flex: 1, padding: '0.75rem', background: 'white', border: '1.5px solid #e2e8f0',
                            borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', color: '#64748b', cursor: 'pointer'
                        }}>Cancel</button>
                        <button type="submit" disabled={saving} style={{
                            flex: 1, padding: '0.75rem', background: '#7C4C2C', border: 'none',
                            borderRadius: '12px', fontWeight: 600, fontSize: '0.9rem', color: 'white',
                            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1
                        }}>{saving ? 'Adding...' : 'Add Freelancer'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
