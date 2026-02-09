"use client";

import { useState, useEffect } from "react";
import { X, Shield, MapPin, Check } from "lucide-react";
import styles from "@/app/venues/venues.module.css"; // Reuse modal styles from venues or globals
import CustomDropdown from "./CustomDropdown";

interface ManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (manager: any) => void;
    editingManager?: any;
    allVenues: { id: number | string; name: string }[];
}

export default function ManagerModal({
    isOpen,
    onClose,
    onSave,
    editingManager,
    allVenues
}: ManagerModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        status: "Active",
        venues: [] as (string | number)[]
    });

    useEffect(() => {
        if (editingManager) {
            setFormData({
                name: editingManager.name || "",
                email: editingManager.email || "",
                password: "", // Keep password empty on edit
                status: editingManager.status || "Active",
                venues: editingManager.venues || []
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                status: "Active",
                venues: []
            });
        }
    }, [editingManager, isOpen]);

    if (!isOpen) return null;

    const toggleVenue = (venueId: string | number) => {
        setFormData(prev => ({
            ...prev,
            venues: prev.venues.includes(venueId)
                ? prev.venues.filter(id => id !== venueId)
                : [...prev.venues, venueId]
        }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>{editingManager ? "Edit Manager" : "Add New Manager"}</h3>
                        <p>{editingManager ? "Modify access and assignments" : "Create a new system operator"}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem 2rem' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Full Name</label>
                            <input
                                className="modal-input"
                                style={{ height: '48px', borderRadius: '12px', background: '#F8FAFC', padding: '0 1.25rem', border: '1.5px solid #e2e8f0' }}
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Email Address</label>
                            <input
                                className="modal-input"
                                style={{ height: '48px', borderRadius: '12px', background: '#F8FAFC', padding: '0 1.25rem', border: '1.5px solid #e2e8f0' }}
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder="manager@nara.com"
                            />
                        </div>
                        {!editingManager && (
                            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Initial Password</label>
                                <input
                                    className="modal-input"
                                    style={{ height: '48px', borderRadius: '12px', background: '#F8FAFC', padding: '0 1.25rem', border: '1.5px solid #e2e8f0' }}
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        )}
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Account Status</label>
                            <CustomDropdown
                                options={[
                                    { id: 'Active', name: 'Active' },
                                    { id: 'Disabled', name: 'Disabled' }
                                ]}
                                value={formData.status}
                                onChange={val => setFormData({ ...formData, status: val })}
                                placeholder="Select Status"
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem', borderTop: '1.5px dashed #e2e8f0', paddingTop: '2rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1a1a1a' }}>Venue Access Assignment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {allVenues.map(venue => (
                                <div
                                    key={venue.id}
                                    onClick={() => toggleVenue(venue.name)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid',
                                        borderColor: formData.venues.includes(venue.name) ? 'var(--primary-color)' : '#f1f5f9',
                                        background: formData.venues.includes(venue.name) ? 'rgba(124, 76, 44, 0.05)' : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: '2px solid',
                                        borderColor: formData.venues.includes(venue.name) ? 'var(--primary-color)' : '#cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: formData.venues.includes(venue.name) ? 'var(--primary-color)' : 'transparent',
                                    }}>
                                        {formData.venues.includes(venue.name) && <Check size={14} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: formData.venues.includes(venue.name) ? '#1a1a1a' : '#64748b' }}>
                                        {venue.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem 2.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        className="button-secondary"
                        onClick={onClose}
                        style={{ background: 'white', color: 'var(--secondary-color)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="button-primary"
                        onClick={() => onSave(formData)}
                        style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)' }}
                    >
                        {editingManager ? "Update Manager" : "Create Account"}
                    </button>
                </div>
            </div>
        </div >
    );
}
