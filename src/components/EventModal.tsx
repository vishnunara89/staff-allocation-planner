"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Venue, CreateEventDTO, Event } from '@/types';
import styles from '../app/events/events.module.css';
import CustomDropdown from '@/components/CustomDropdown';
import PremiumTimePicker from '@/components/PremiumTimePicker';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<CreateEventDTO>) => Promise<void>;
    venues: Venue[];
    editingEvent: Partial<Event> | null;
    selectedDate: string;
}

const PRIORITY_OPTIONS = [
    { id: 'low', name: 'Low Priority' },
    { id: 'normal', name: 'Normal Priority' },
    { id: 'high', name: 'High Priority/VIP' }
];

export default function EventModal({
    isOpen,
    onClose,
    onSave,
    venues,
    editingEvent,
    selectedDate
}: EventModalProps) {
    const [formData, setFormData] = useState<Partial<CreateEventDTO>>({
        guest_count: 50,
        priority: 'normal',
        start_time: '18:00',
        end_time: '23:00',
        special_requirements: '[]'
    });
    const [submitting, setSubmitting] = useState(false);

    // Requirements Picker state
    const [showReqPicker, setShowReqPicker] = useState(false);
    const [reqSearch, setReqSearch] = useState('');
    const [reqOptions, setReqOptions] = useState<any[]>([]);

    useEffect(() => {
        if (editingEvent) {
            setFormData(editingEvent);
        } else {
            setFormData({
                guest_count: 50,
                priority: 'normal',
                start_time: '18:00',
                end_time: '23:00',
                special_requirements: '[]'
            });
        }
    }, [editingEvent, isOpen]);

    useEffect(() => {
        if (isOpen) {
            fetchReqOptions();
        }
    }, [isOpen]);

    async function fetchReqOptions() {
        try {
            const res = await fetch('/api/requirements');
            if (res.ok) setReqOptions(await res.json());
        } catch (e) { }
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const getRequirements = () => {
        try {
            const reqs = formData.special_requirements ?
                (typeof formData.special_requirements === 'string' && formData.special_requirements.startsWith('[') ?
                    JSON.parse(formData.special_requirements) : [])
                : [];
            return Array.isArray(reqs) ? reqs : [];
        } catch (e) { return []; }
    };

    const updateRequirements = (reqs: any[]) => {
        setFormData({ ...formData, special_requirements: JSON.stringify(reqs) });
    };

    if (!isOpen) return null;

    const venueOptions = venues.map(v => ({ id: v.id!, name: v.name }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>{editingEvent?.id ? 'Edit Event Details' : 'Design New Event'}</h3>
                        <p>{selectedDate}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body">
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Venue Location</label>
                                <CustomDropdown
                                    options={venueOptions}
                                    value={formData.venue_id || ''}
                                    onChange={val => setFormData({ ...formData, venue_id: Number(val) })}
                                    placeholder="Select Venue..."
                                    icon={<span>📍</span>}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Guest Attendance</label>
                                <div className={styles.inputWithIcon}>
                                    <input
                                        className={styles.formInput}
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.guest_count}
                                        onChange={e => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className={styles.inputIcon}>👤</span>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Start Time</label>
                                <PremiumTimePicker
                                    value={formData.start_time || '18:00'}
                                    onChange={val => setFormData({ ...formData, start_time: val })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>End Time</label>
                                <PremiumTimePicker
                                    value={formData.end_time || '23:00'}
                                    onChange={val => setFormData({ ...formData, end_time: val })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Event Priority</label>
                                <CustomDropdown
                                    options={PRIORITY_OPTIONS}
                                    value={formData.priority || 'normal'}
                                    onChange={val => setFormData({ ...formData, priority: val as any })}
                                    placeholder="Normal Priority"
                                    icon={<span>⚡</span>}
                                />
                            </div>
                        </div>

                        <div className={styles.requirementsSection}>
                            <div className={styles.sectionHeader}>
                                <h4>Special Requirements</h4>
                                <button
                                    type="button"
                                    className={styles.btnAddReq}
                                    onClick={() => setShowReqPicker(true)}
                                >
                                    + Add Skill or Language
                                </button>
                            </div>

                            <div className={styles.selectedReqsList}>
                                {getRequirements().length === 0 ? (
                                    <div className={styles.emptyReqs}>No special staff requirements added yet.</div>
                                ) : (
                                    getRequirements().map((r: any, idx: number) => (
                                        <div key={idx} className={styles.reqBadge}>
                                            <span className={styles.reqQty}>{r.quantity}x</span>
                                            <span className={styles.reqValue}>{r.value}</span>
                                            <span className={styles.reqType}>{r.type}</span>
                                            <button
                                                type="button"
                                                className={styles.btnRemoveReq}
                                                onClick={() => {
                                                    const newReqs = [...getRequirements()];
                                                    newReqs.splice(idx, 1);
                                                    updateRequirements(newReqs);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className={styles.buttonCancel} onClick={onClose}>Discard</button>
                        <button type="submit" className={styles.buttonSubmit} disabled={submitting}>
                            {submitting ? 'Processing...' : (editingEvent?.id ? 'Update Event' : 'Create Event')}
                        </button>
                    </div>
                </form>

                {/* Requirements Picker Overlay */}
                {showReqPicker && (
                    <div className={styles.pickerOverlay}>
                        <div className={styles.pickerPopup}>
                            <div className={styles.pickerHeader}>
                                <h5>Staff Requirements</h5>
                                <button type="button" onClick={() => setShowReqPicker(false)}>×</button>
                            </div>
                            <div className={styles.pickerSearchBox}>
                                <input
                                    type="text"
                                    placeholder="Search skills, languages..."
                                    value={reqSearch}
                                    onChange={e => setReqSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.pickerResults}>
                                {reqOptions.filter(o => o.value.toLowerCase().includes(reqSearch.toLowerCase())).map((opt, i) => (
                                    <div key={i} className={styles.pickerItem} onClick={() => {
                                        const currentReqs = getRequirements();
                                        const existing = currentReqs.find((r: any) => r.value === opt.value && r.type === opt.type);
                                        if (existing) {
                                            existing.quantity += 1;
                                        } else {
                                            currentReqs.push({ type: opt.type, value: opt.value, quantity: 1 });
                                        }
                                        updateRequirements(currentReqs);
                                        setShowReqPicker(false);
                                        setReqSearch('');
                                    }}>
                                        <div className={styles.pickerItemInfo}>
                                            <span className={styles.itemValue}>{opt.value}</span>
                                            <span className={styles.itemType}>{opt.type}</span>
                                        </div>
                                        <div className={styles.itemMeta}>
                                            {opt.available_internal} available
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
