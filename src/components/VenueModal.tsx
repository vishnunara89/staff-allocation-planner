"use client";

import { useState } from "react";
import { X, Plus, Loader2, Save } from "lucide-react";

interface VenueModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function VenueModal({ isOpen, onClose, onSuccess }: VenueModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "CAMP",
        notes: ""
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/venues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSuccess();
                setFormData({
                    name: "",
                    type: "CAMP",
                    notes: ""
                });
                onClose();
            }
        } catch (error) {
            console.error("Failed to add venue:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>Add New Venue</h3>
                        <p>Register a new operational location.</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group-standard">
                            <label className="form-label-standard">Venue Name *</label>
                            <input
                                type="text"
                                required
                                className="modal-input"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. SONARA LUXURY CAMP"
                            />
                        </div>
                        <div className="form-group-standard">
                            <label className="form-label-standard">Type</label>
                            <select
                                className="modal-input"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                style={{ background: 'var(--input-bg)' }}
                            >
                                <option value="CAMP">CAMP</option>
                                <option value="LUXURY CAMP">LUXURY CAMP</option>
                                <option value="RESTAURANT">RESTAURANT</option>
                                <option value="SEASONAL">SEASONAL</option>
                                <option value="OFFICE">OFFICE</option>
                            </select>
                        </div>
                        <div className="form-group-standard">
                            <label className="form-label-standard">Brief Description</label>
                            <textarea
                                className="modal-input"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes about this location..."
                                style={{ minHeight: '120px', padding: '1rem', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            className="secondary"
                            style={{
                                height: '48px',
                                padding: '0 2rem',
                                background: '#f1f5f9',
                                color: '#364a67ff',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                height: '48px',
                                padding: '0 2rem',
                                background: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSubmitting ? "Saving..." : "Save Venue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
