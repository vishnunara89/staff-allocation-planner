"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { X, CalendarDays, Users, Clock, MapPin, Zap, Trash2, ChevronDown, Plus, Minus, FileText } from 'lucide-react';
import { Venue, CreateEventDTO, Event } from '@/types';
import PremiumTimePicker from '@/components/PremiumTimePicker';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<CreateEventDTO>) => Promise<void>;
    venues: Venue[];
    editingEvent: Partial<Event> | null;
    selectedDate: string;
}

interface Skill {
    id: number;
    name: string;
}

interface SkillRequirement {
    skill: string;
    quantity: number;
}

const PRIORITY_OPTIONS = [
    { id: 'normal', name: 'Normal Event' },
    { id: 'vip', name: 'VIP Event' },
    { id: 'vvip', name: 'VVIP Event' }
];

/* ===================================
   SKILL SELECTOR (Simplified InlineDropdown)
=================================== */
function SkillSelector({
    items,
    onSelect,
    placeholder
}: {
    items: { id: number; name: string }[];
    onSelect: (name: string) => void;
    placeholder: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', height: '52px', padding: '0 1rem',
                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                    background: '#f8fafc', outline: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '1rem', fontWeight: 600, color: '#94a3b8',
                    transition: 'border-color 0.2s',
                    ...(isOpen ? { borderColor: 'var(--primary-color)' } : {})
                }}
            >
                <span>{placeholder}</span>
                <ChevronDown size={18} style={{
                    color: '#94a3b8',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'white', borderRadius: '12px', marginTop: '4px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                    overflow: 'hidden', maxHeight: '280px', display: 'flex', flexDirection: 'column'
                }}>
                    {/* Search */}
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                            style={{
                                width: '100%', height: '36px', border: '1px solid #e2e8f0',
                                borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.9rem',
                                outline: 'none', background: '#f8fafc', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Items */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {filtered.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    onSelect(item.name);
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                style={{
                                    padding: '0.6rem 0.75rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    fontSize: '0.95rem', fontWeight: 600,
                                    color: '#1a1a1a',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,76,44,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {item.name}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EventModal({
    isOpen,
    onClose,
    onSave,
    venues,
    editingEvent,
    selectedDate
}: EventModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [skills, setSkills] = useState<Skill[]>([]);

    const [formData, setFormData] = useState<Partial<CreateEventDTO>>({
        event_name: '',
        date: selectedDate,
        guest_count: 50,
        priority: 'normal',
        start_time: '18:00',
        end_time: '23:00',
        special_requirements: '[]'
    });

    useEffect(() => {
        if (isOpen) {
            fetchSkills();
        }
    }, [isOpen]);

    useEffect(() => {
        if (editingEvent) {
            setFormData({
                ...editingEvent,
                event_name: editingEvent.event_name || '',
                special_requirements: editingEvent.special_requirements || '[]'
            });
        } else {
            setFormData({
                event_name: '',
                date: selectedDate,
                guest_count: 50,
                priority: 'normal',
                start_time: '18:00',
                end_time: '23:00',
                special_requirements: '[]'
            });
        }
    }, [editingEvent, isOpen, selectedDate]);

    async function fetchSkills() {
        try {
            const res = await fetch('/api/skills');
            if (res.ok) setSkills(await res.json());
        } catch (e) {
            console.error('Failed to fetch skills', e);
        }
    }

    const getRequirements = (): SkillRequirement[] => {
        try {
            const raw = formData.special_requirements;
            if (!raw || raw === '[]') return [];

            const parsed = JSON.parse(raw);

            // Check & Migrate old format: [{type: 'skill', value: 'X', quantity: 1}]
            if (Array.isArray(parsed) && parsed.length > 0 && 'type' in parsed[0]) {
                return parsed
                    .filter((r: any) => r.type === 'skill')
                    .map((r: any) => ({
                        skill: r.value,
                        quantity: r.quantity || 1
                    }));
            }

            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    const updateRequirements = (reqs: SkillRequirement[]) => {
        setFormData({ ...formData, special_requirements: JSON.stringify(reqs) });
    };

    const addSkill = (skillName: string) => {
        const current = getRequirements();
        if (current.find(r => r.skill === skillName)) return;
        updateRequirements([...current, { skill: skillName, quantity: 1 }]);
    };

    const removeSkill = (skillName: string) => {
        updateRequirements(getRequirements().filter(r => r.skill !== skillName));
    };

    const updateQuantity = (skillName: string, delta: number) => {
        const current = getRequirements().map(r => {
            if (r.skill === skillName) {
                return { ...r, quantity: Math.max(1, r.quantity + delta) };
            }
            return r;
        });
        updateRequirements(current);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.event_name?.trim()) {
            alert('Event name is required');
            return;
        }

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

    if (!isOpen) return null;

    const selectedReqs = getRequirements();
    const availableSkills = skills.filter(s => !selectedReqs.find(r => r.skill === s.name));

    // Styles for labels and inputs (matching EmployeeModal)
    const labelStyle: React.CSSProperties = {
        fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.05em',
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', height: '52px', padding: '0 1rem',
        border: '1.5px solid #e2e8f0', borderRadius: '12px',
        background: '#f8fafc', outline: 'none', fontSize: '1rem',
        fontWeight: 600, boxSizing: 'border-box'
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                {/* HEADER */}
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>{editingEvent?.id ? 'Edit Event Details' : 'Design New Event'}</h3>
                        <p>{editingEvent?.date || selectedDate}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="modal-body" style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', rowGap: '1.75rem' }}>

                            {/* 1. Event Name */}
                            <div>
                                <label style={labelStyle}>
                                    <FileText size={16} style={{ color: 'var(--primary-color)' }} /> Event Name
                                </label>
                                <input
                                    style={inputStyle}
                                    value={formData.event_name}
                                    onChange={e => setFormData({ ...formData, event_name: e.target.value })}
                                    placeholder="e.g. Corporate Dinner, Wedding Reception"
                                    required
                                />
                            </div>

                            {/* 2. Venue Location */}
                            <div>
                                <label style={labelStyle}>
                                    <MapPin size={16} style={{ color: 'var(--primary-color)' }} /> Venue Location
                                </label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={formData.venue_id || ''}
                                    onChange={e => setFormData({ ...formData, venue_id: Number(e.target.value) })}
                                    required
                                >
                                    <option value="">Select Venue...</option>
                                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>

                            {/* 3. Guest Attendance */}
                            <div>
                                <label style={labelStyle}>
                                    <Users size={16} style={{ color: 'var(--primary-color)' }} /> Guest Attendance
                                </label>
                                <input
                                    type="number"
                                    style={inputStyle}
                                    min="1"
                                    required
                                    value={formData.guest_count}
                                    onChange={e => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            {/* 4. Event Date */}
                            <div>
                                <label style={labelStyle}>
                                    <CalendarDays size={16} style={{ color: 'var(--primary-color)' }} /> Event Date
                                </label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    required
                                    value={formData.date || selectedDate}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>

                            {/* 5. Start Time */}
                            <div>
                                <label style={labelStyle}>
                                    <Clock size={16} style={{ color: 'var(--primary-color)' }} /> Start Time
                                </label>
                                <PremiumTimePicker
                                    value={formData.start_time || '18:00'}
                                    onChange={val => setFormData({ ...formData, start_time: val })}
                                />
                            </div>

                            {/* 6. End Time */}
                            <div>
                                <label style={labelStyle}>End Time</label>
                                <PremiumTimePicker
                                    value={formData.end_time || '23:00'}
                                    onChange={val => setFormData({ ...formData, end_time: val })}
                                />
                            </div>

                            {/* 7. Event Priority (Full Width) */}
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={labelStyle}>
                                    <Zap size={16} style={{ color: 'var(--primary-color)' }} /> Event Priority
                                </label>
                                <select
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    value={formData.priority || 'normal'}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                >
                                    {PRIORITY_OPTIONS.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 8. Special Requirements (Full Width) */}
                            <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                <label style={{ ...labelStyle, fontSize: '0.9rem', marginBottom: '1rem' }}>
                                    <Zap size={18} style={{ color: 'var(--primary-color)' }} /> Special Requirements
                                </label>

                                {/* Selected Skills List */}
                                {selectedReqs.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                                        {selectedReqs.map((req, idx) => (
                                            <div key={idx} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                                padding: '0.4rem 0.5rem 0.4rem 0.75rem', background: 'rgba(124,76,44,0.08)',
                                                borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600,
                                                color: 'var(--primary-color)', border: '1px solid rgba(124,76,44,0.1)'
                                            }}>
                                                {/* Quantity Stepper */}
                                                <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '12px', padding: '0 2px' }}>
                                                    <button type="button" onClick={() => updateQuantity(req.skill, -1)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '2px 4px' }}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span style={{ fontSize: '0.8rem', minWidth: '16px', textAlign: 'center', color: '#334155' }}>{req.quantity}</span>
                                                    <button type="button" onClick={() => updateQuantity(req.skill, 1)}
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '2px 4px' }}
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>

                                                <span>{req.skill}</span>

                                                <button type="button" onClick={() => removeSkill(req.skill)}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        padding: '4px', color: '#94a3b8', display: 'flex', alignItems: 'center',
                                                        marginLeft: '4px'
                                                    }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <SkillSelector
                                    items={availableSkills}
                                    onSelect={addSkill}
                                    placeholder="Add skill requirement..."
                                />
                            </div>
                        </div>

                    </div>

                    <div className="modal-footer" style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={onClose}
                            style={{
                                height: '48px', padding: '0 1.5rem', borderRadius: '12px',
                                border: '1.5px solid #e2e8f0', background: 'white',
                                fontWeight: 600, color: '#64748b', cursor: 'pointer', fontSize: '0.95rem'
                            }}
                        >
                            Discard
                        </button>
                        <button type="submit" disabled={submitting}
                            style={{
                                height: '48px', padding: '0 1.5rem', borderRadius: '12px',
                                border: 'none', background: 'var(--primary-color)', color: 'white',
                                fontWeight: 700, cursor: 'pointer', display: 'flex',
                                alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem',
                                boxShadow: '0 4px 12px rgba(124, 76, 44, 0.25)'
                            }}
                        >
                            {submitting ? 'Processing...' : (editingEvent?.id ? 'Update Event' : 'Create Event')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
