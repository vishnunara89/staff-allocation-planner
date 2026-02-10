"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2, User } from "lucide-react";
import { Venue, Role, StaffMember } from "@/types";

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    venues: Venue[];
    roles: Role[];
    initialData?: StaffMember | null;
    readOnly?: boolean;
}

export default function EmployeeModal({
    isOpen,
    onClose,
    onSuccess,
    venues,
    roles,
    initialData = null,
    readOnly = false
}: EmployeeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial state logic
    const getInitialState = () => {
        if (initialData) {
            // Extract phone from notes if it follows the pattern "Phone: ...\n"
            const phoneMatch = (initialData.notes || '').match(/Phone: (.*?)\n/);
            const phone = phoneMatch ? phoneMatch[1] : '';
            const notes = initialData.notes ? initialData.notes.replace(/Phone: (.*?)\n/, '') : '';

            return {
                full_name: initialData.full_name || "",
                primary_role_id: String(initialData.primary_role_id || ""),
                home_base_venue_id: String(initialData.home_base_venue_id || ""),
                phone: phone,
                notes: notes
            };
        }
        return {
            full_name: "",
            primary_role_id: "",
            home_base_venue_id: "",
            phone: "",
            notes: ""
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    // Update form when initialData changes (e.g. when opening a different profile)
    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
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
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div>
                        <h3>{readOnly ? 'Employee Profile' : 'Add New Employee'}</h3>
                        <p>{readOnly ? 'Viewing detailed workforce record.' : 'Register a new staff member to the registry.'}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group-standard">
                            <label className="form-label-standard">Full Name *</label>
                            <input
                                type="text"
                                required
                                disabled={readOnly}
                                className="modal-input"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label-standard">Primary Role *</label>
                                <select
                                    required
                                    disabled={readOnly}
                                    className="modal-input"
                                    value={formData.primary_role_id}
                                    onChange={e => setFormData({ ...formData, primary_role_id: e.target.value })}
                                    style={{ background: 'var(--input-bg)' }}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label-standard">Home Base</label>
                                <select
                                    disabled={readOnly}
                                    className="modal-input"
                                    value={formData.home_base_venue_id}
                                    onChange={e => setFormData({ ...formData, home_base_venue_id: e.target.value })}
                                    style={{ background: 'var(--input-bg)' }}
                                >
                                    <option value="">No venue assigned</option>
                                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group-standard">
                            <label className="form-label-standard">Phone Number</label>
                            <input
                                type="tel"
                                disabled={readOnly}
                                className="modal-input"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. +971 50..."
                            />
                        </div>

                        <div className="form-group-standard">
                            <label className="form-label-standard">Additional Notes</label>
                            <textarea
                                disabled={readOnly}
                                className="modal-input"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="e.g. Specializes in desserts, knows Russian..."
                                style={{ minHeight: '100px', padding: '1rem', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="secondary"
                            style={{ height: '48px', padding: '0 2rem' }}
                        >
                            {readOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!readOnly && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{ height: '48px', padding: '0 2rem' }}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                                Save Employee
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
