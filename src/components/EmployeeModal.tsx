"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { Venue, Role } from "@/types";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    venues: Venue[];
    roles: Role[];
}

export default function EmployeeModal({ isOpen, onClose, onSuccess, venues, roles }: EmployeeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        primary_role_id: "",
        home_base_venue_id: "",
        phone: "",
        notes: ""
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.full_name || !formData.primary_role_id) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: formData.full_name,
                    primary_role_id: Number(formData.primary_role_id),
                    home_base_venue_id: formData.home_base_venue_id ? Number(formData.home_base_venue_id) : null,
                    notes: formData.phone ? `Phone: ${formData.phone}\n${formData.notes}` : formData.notes,
                    employment_type: 'internal',
                    availability_status: 'available'
                })
            });

            if (res.ok) {
                onSuccess();
                setFormData({
                    full_name: "",
                    primary_role_id: "",
                    home_base_venue_id: "",
                    phone: "",
                    notes: ""
                });
                onClose();
            }
        } catch (error) {
            console.error("Failed to add employee:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <div>
                        <h2>Add New Employee</h2>
                        <p>Register a new staff member to the registry.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="modal-input"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Primary Role *</label>
                                    <select
                                        required
                                        value={formData.primary_role_id}
                                        onChange={e => setFormData({ ...formData, primary_role_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none', background: 'white' }}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Home Base</label>
                                    <select
                                        value={formData.home_base_venue_id}
                                        onChange={e => setFormData({ ...formData, home_base_venue_id: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none', background: 'white' }}
                                    >
                                        <option value="">No venue assigned</option>
                                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="e.g. +971 50..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>Additional Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="e.g. Specializes in desserts, knows Russian..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                            Save Employee
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
