"use client";

import { useState, useEffect, useRef } from "react";
import {
    X, UserPlus, Loader2, Trash2, Plus, ChevronDown,
    Briefcase, Zap, Phone, MapPin, FileText, Clock, CalendarDays, Save, Pencil, Globe
} from "lucide-react";
import { Venue, Role, StaffMember } from "@/types";

interface Skill {
    id: number;
    name: string;
}

interface EventItem {
    id: number;
    date: string;
    venue_id: number;
    guest_count: number;
    venue_name?: string;
}

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    venues: Venue[];
    roles: Role[];
    initialData?: StaffMember | null;
    readOnly?: boolean;
}

const LANGUAGES = [
    "English", "Spanish", "French", "Arabic", "Mandarin", "Hindi",
    "Portuguese", "Russian", "Japanese", "German", "Italian",
    "Korean", "Dutch", "Swedish", "Other"
];

const PROFICIENCIES = [
    { id: 'basic', name: 'Basic' },
    { id: 'conversational', name: 'Conversational' },
    { id: 'fluent', name: 'Fluent' },
    { id: 'native', name: 'Native' }
];

/* ===================================
   INLINE DROPDOWN WITH ADD/DELETE
=================================== */
function InlineDropdown({
    label,
    icon: Icon,
    items,
    value,
    onChange,
    onAdd,
    onDelete,
    placeholder,
    readOnly = false
}: {
    label: string;
    icon: any;
    items: { id: number; name: string }[];
    value: string;
    onChange: (val: string) => void;
    onAdd: (name: string) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    placeholder: string;
    readOnly?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsAdding(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );
    const selectedItem = items.find(i => String(i.id) === value);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setAddLoading(true);
        try {
            await onAdd(newName.trim());
            setNewName("");
            setIsAdding(false);
        } finally {
            setAddLoading(false);
        }
    };

    return (
        <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label className="form-label-standard" style={{
                fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
            }}>
                <Icon size={16} style={{ color: 'var(--primary-color)' }} /> {label}
            </label>
            <button
                type="button"
                disabled={readOnly}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%', height: '52px', padding: '0 1rem',
                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                    background: '#f8fafc', outline: 'none', cursor: readOnly ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '1rem', fontWeight: 600, color: selectedItem ? '#1a1a1a' : '#94a3b8',
                    transition: 'border-color 0.2s',
                    ...(isOpen ? { borderColor: 'var(--primary-color)' } : {})
                }}
            >
                <span>{selectedItem?.name || placeholder}</span>
                <ChevronDown size={18} style={{
                    color: '#94a3b8',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
            </button>

            {isOpen && !readOnly && (
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
                                style={{
                                    padding: '0.6rem 0.75rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    fontSize: '0.95rem', fontWeight: 600,
                                    background: String(item.id) === value ? 'rgba(124,76,44,0.06)' : 'transparent',
                                    color: String(item.id) === value ? 'var(--primary-color)' : '#1a1a1a',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,76,44,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = String(item.id) === value ? 'rgba(124,76,44,0.06)' : 'transparent')}
                            >
                                <span
                                    onClick={() => {
                                        onChange(String(item.id));
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    style={{ flex: 1, cursor: 'pointer' }}
                                >
                                    {item.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${item.name}"? This will update all references.`)) {
                                            await onDelete(item.id);
                                            if (String(item.id) === value) onChange("");
                                        }
                                    }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: '#cbd5e1', padding: '4px', borderRadius: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'color 0.15s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
                                    title={`Delete ${item.name}`}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                        {filtered.length === 0 && !isAdding && (
                            <div style={{ padding: '1rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.85rem' }}>
                                No matches found
                            </div>
                        )}
                    </div>

                    {/* Add New */}
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '0.5rem 0.75rem' }}>
                        {isAdding ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    placeholder={`New ${label.toLowerCase()} name...`}
                                    autoFocus
                                    style={{
                                        flex: 1, height: '36px', border: '1.5px solid var(--primary-color)',
                                        borderRadius: '8px', padding: '0 0.75rem', fontSize: '0.9rem',
                                        outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAdd}
                                    disabled={addLoading}
                                    style={{
                                        height: '36px', padding: '0 1rem', borderRadius: '8px',
                                        background: 'var(--primary-color)', color: 'white',
                                        border: 'none', fontWeight: 700, fontSize: '0.85rem',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                                    }}
                                >
                                    {addLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                style={{
                                    width: '100%', padding: '0.5rem', border: 'none',
                                    background: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '0.4rem', color: 'var(--primary-color)',
                                    fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px',
                                    transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,76,44,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <Plus size={16} /> Add New {label}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ===================================
   MAIN EMPLOYEE MODAL
=================================== */
export default function EmployeeModal({
    isOpen,
    onClose,
    onSuccess,
    venues,
    roles: initialRoles,
    initialData = null,
    readOnly = false
}: EmployeeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<Role[]>(initialRoles);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
    const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
    const isEditMode = !!initialData;

    // Form state
    const getInitialState = () => {
        if (initialData) {
            return {
                full_name: initialData.full_name || "",
                primary_role_id: String(initialData.primary_role_id || ""),
                home_base_venue_id: String(initialData.home_base_venue_id || ""),
                phone: initialData.phone || "",
                notes: initialData.notes || "",
                current_event_id: String(initialData.current_event_id || ""),
                working_hours: String(initialData.working_hours || "")
            };
        }
        return {
            full_name: "",
            primary_role_id: "",
            home_base_venue_id: "",
            phone: "",
            notes: "",
            current_event_id: "",
            working_hours: ""
        };
    };

    const [formData, setFormData] = useState(getInitialState());

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialState());
            setSelectedSkills(initialData?.special_skills || []);

            // Parse other_languages JSON
            try {
                const langs = initialData?.other_languages;
                if (langs) {
                    setSelectedLanguages(typeof langs === 'string' ? JSON.parse(langs) : langs);
                } else {
                    setSelectedLanguages({});
                }
            } catch (e) {
                setSelectedLanguages({});
            }

            fetchRoles();
            fetchSkills();
            fetchEvents();
        }
    }, [initialData, isOpen]);

    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);

    async function fetchRoles() {
        try {
            const res = await fetch('/api/roles');
            const data = await res.json();
            if (Array.isArray(data)) setRoles(data);
        } catch { /* silently fail */ }
    }

    async function fetchSkills() {
        try {
            const res = await fetch('/api/skills');
            const data = await res.json();
            if (Array.isArray(data)) setSkills(data);
        } catch { /* silently fail */ }
    }

    async function fetchEvents() {
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            if (Array.isArray(data)) setEvents(data);
        } catch { /* silently fail */ }
    }

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        if (!formData.full_name || !formData.primary_role_id) return;

        setIsSubmitting(true);
        try {
            const payload = {
                full_name: formData.full_name,
                primary_role_id: Number(formData.primary_role_id),
                home_base_venue_id: formData.home_base_venue_id ? Number(formData.home_base_venue_id) : null,
                phone: formData.phone,
                notes: formData.notes,
                employment_type: 'internal',
                availability_status: initialData?.availability_status || 'available',
                special_skills: selectedSkills,
                other_languages: selectedLanguages, // Send as object, API will stringify if needed
                current_event_id: formData.current_event_id ? Number(formData.current_event_id) : null,
                working_hours: formData.working_hours ? Number(formData.working_hours) : 0
            };

            const url = isEditMode ? `/api/staff/${initialData!.id}` : '/api/staff';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error("Failed to save employee:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    /* Role CRUD */
    const handleAddRole = async (name: string) => {
        const res = await fetch('/api/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) await fetchRoles();
    };

    const handleDeleteRole = async (id: number) => {
        const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
        if (res.ok) await fetchRoles();
    };

    /* Skill CRUD */
    const handleAddSkill = async (name: string) => {
        const res = await fetch('/api/skills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (res.ok) await fetchSkills();
    };

    const handleDeleteSkill = async (id: number) => {
        const res = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
        if (res.ok) await fetchSkills();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
                {/* HEADER */}
                <div className="modal-header">
                    <div>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isEditMode ? <Pencil size={20} /> : <UserPlus size={20} />}
                            {readOnly ? 'Employee Profile' : isEditMode ? 'Edit Employee' : 'Add New Employee'}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
                            {readOnly ? 'Viewing detailed workforce record.' :
                                isEditMode ? 'Update employee information and assignments.' :
                                    'Register a new staff member to the registry.'}
                        </p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '1.5rem 2rem', overflowY: 'auto', maxHeight: '65vh' }}>

                        {/* Full Name */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                            }}>
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                disabled={readOnly}
                                className="modal-input"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder="e.g. John Doe"
                                style={{
                                    width: '100%', height: '52px', padding: '0 1rem',
                                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                    background: '#f8fafc', outline: 'none', fontSize: '1rem',
                                    fontWeight: 600, boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Phone Number */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                            }}>
                                <Phone size={16} style={{ color: 'var(--primary-color)' }} /> Phone Number
                            </label>
                            <input
                                type="tel"
                                disabled={readOnly}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="e.g. +971 50 123 4567"
                                style={{
                                    width: '100%', height: '52px', padding: '0 1rem',
                                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                    background: '#f8fafc', outline: 'none', fontSize: '1rem',
                                    fontWeight: 600, boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Home Camp + Primary Role — 2-col grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            {/* Home Camp */}
                            <div className="form-group">
                                <label style={{
                                    fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                                }}>
                                    <MapPin size={16} style={{ color: 'var(--primary-color)' }} /> Home Camp
                                </label>
                                <select
                                    disabled={readOnly}
                                    value={formData.home_base_venue_id}
                                    onChange={e => setFormData({ ...formData, home_base_venue_id: e.target.value })}
                                    style={{
                                        width: '100%', height: '52px', padding: '0 1rem',
                                        border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                        background: '#f8fafc', outline: 'none', fontSize: '1rem',
                                        fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Select Venue</option>
                                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>

                            {/* Primary Role — InlineDropdown */}
                            <InlineDropdown
                                label="Role"
                                icon={Briefcase}
                                items={roles}
                                value={formData.primary_role_id}
                                onChange={val => setFormData({ ...formData, primary_role_id: val })}
                                onAdd={handleAddRole}
                                onDelete={handleDeleteRole}
                                placeholder="Select Role *"
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Skill Dropdown + Selected Skills Tags */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            {/* Selected skills tags */}
                            {selectedSkills.length > 0 && (
                                <div style={{
                                    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem'
                                }}>
                                    {selectedSkills.map(skillName => (
                                        <span key={skillName} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.3rem 0.75rem', background: 'rgba(124,76,44,0.08)',
                                            borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                            color: 'var(--primary-color)'
                                        }}>
                                            <Zap size={13} /> {skillName}
                                            {!readOnly && (
                                                <button type="button" onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skillName))}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <InlineDropdown
                                label="Skill"
                                icon={Zap}
                                items={skills.filter(s => !selectedSkills.includes(s.name))}
                                value=""
                                onChange={val => {
                                    const skill = skills.find(s => String(s.id) === val);
                                    if (skill && !selectedSkills.includes(skill.name)) {
                                        setSelectedSkills(prev => [...prev, skill.name]);
                                    }
                                }}
                                onAdd={handleAddSkill}
                                onDelete={handleDeleteSkill}
                                placeholder="Add a skill..."
                                readOnly={readOnly}
                            />
                        </div>

                        {/* Language Selection Section */}
                        <div style={{ marginBottom: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' }}>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem'
                            }}>
                                <Globe size={16} style={{ color: 'var(--primary-color)' }} /> LANGUAGES
                            </label>

                            {/* Selected languages tags */}
                            {Object.entries(selectedLanguages).length > 0 && (
                                <div style={{
                                    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem'
                                }}>
                                    {Object.entries(selectedLanguages).map(([lang, prof]) => (
                                        <span key={lang} style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.3rem 0.75rem', background: 'rgba(124,76,44,0.08)',
                                            borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                            color: 'var(--primary-color)', border: '1px solid rgba(124,76,44,0.1)'
                                        }}>
                                            {lang} <span style={{ opacity: 0.6, fontSize: '0.75rem', fontWeight: 500 }}>({prof.charAt(0).toUpperCase() + prof.slice(1)})</span>
                                            {!readOnly && (
                                                <button type="button" onClick={() => {
                                                    const updated = { ...selectedLanguages };
                                                    delete updated[lang];
                                                    setSelectedLanguages(updated);
                                                }}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: '#94a3b8', display: 'flex', alignItems: 'center', marginLeft: '2px' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {!readOnly && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <select
                                            value={activeLanguage || ""}
                                            onChange={(e) => setActiveLanguage(e.target.value)}
                                            style={{
                                                width: '100%', height: '48px', padding: '0 1rem',
                                                border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                                background: '#f8fafc', outline: 'none', fontSize: '0.95rem',
                                                fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box'
                                            }}
                                        >
                                            <option value="">Add language...</option>
                                            {LANGUAGES.filter(l => !selectedLanguages[l]).map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {activeLanguage && (
                                        <div style={{ flex: 1 }}>
                                            <select
                                                autoFocus
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setSelectedLanguages(prev => ({
                                                            ...prev,
                                                            [activeLanguage]: e.target.value
                                                        }));
                                                        setActiveLanguage(null);
                                                    }
                                                }}
                                                style={{
                                                    width: '100%', height: '48px', padding: '0 1rem',
                                                    border: '1.5px solid var(--primary-color)', borderRadius: '12px',
                                                    background: 'white', outline: 'none', fontSize: '0.95rem',
                                                    fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box'
                                                }}
                                            >
                                                <option value="">Select proficiency...</option>
                                                {PROFICIENCIES.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* EDIT MODE: Event Assignment + Working Hours */}
                        {isEditMode && (
                            <div style={{
                                background: '#f8fafc', borderRadius: '14px', padding: '1.25rem',
                                border: '1.5px solid #f1f5f9', marginBottom: '1.25rem'
                            }}>
                                <div style={{
                                    fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}>
                                    <CalendarDays size={16} style={{ color: 'var(--primary-color)' }} /> Current Assignment
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    {/* Current Event */}
                                    <div>
                                        <label style={{
                                            fontSize: '0.75rem', fontWeight: 600, color: '#64748b',
                                            display: 'block', marginBottom: '0.4rem'
                                        }}>
                                            Working Event
                                        </label>
                                        <select
                                            disabled={readOnly}
                                            value={formData.current_event_id}
                                            onChange={e => setFormData({ ...formData, current_event_id: e.target.value })}
                                            style={{
                                                width: '100%', height: '48px', padding: '0 0.75rem',
                                                border: '1.5px solid #e2e8f0', borderRadius: '10px',
                                                background: 'white', outline: 'none', fontSize: '0.95rem',
                                                fontWeight: 600, cursor: 'pointer', boxSizing: 'border-box'
                                            }}
                                        >
                                            <option value="">No event assigned</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.venue_name || `Event #${ev.id}`} — {ev.date} ({ev.guest_count} pax)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Working Hours */}
                                    <div>
                                        <label style={{
                                            fontSize: '0.75rem', fontWeight: 600, color: '#64748b',
                                            display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem'
                                        }}>
                                            <Clock size={14} /> Working Hours
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="24"
                                            step="0.5"
                                            disabled={readOnly}
                                            value={formData.working_hours}
                                            onChange={e => setFormData({ ...formData, working_hours: e.target.value })}
                                            placeholder="e.g. 8"
                                            style={{
                                                width: '100%', height: '48px', padding: '0 0.75rem',
                                                border: '1.5px solid #e2e8f0', borderRadius: '10px',
                                                background: 'white', outline: 'none', fontSize: '0.95rem',
                                                fontWeight: 600, boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Notes */}
                        <div>
                            <label style={{
                                fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem'
                            }}>
                                <FileText size={16} style={{ color: 'var(--primary-color)' }} /> Additional Notes
                            </label>
                            <textarea
                                disabled={readOnly}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="e.g. VIP experience, speaks Russian, dessert specialist..."
                                style={{
                                    width: '100%', minHeight: '100px', padding: '1rem',
                                    border: '1.5px solid #e2e8f0', borderRadius: '12px',
                                    background: '#f8fafc', outline: 'none', fontSize: '1rem',
                                    fontWeight: 500, resize: 'vertical', boxSizing: 'border-box',
                                    fontFamily: 'inherit', lineHeight: 1.5
                                }}
                            />
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="modal-footer" style={{
                        padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9',
                        display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                height: '48px', padding: '0 1.5rem', borderRadius: '12px',
                                border: '1.5px solid #e2e8f0', background: 'white',
                                fontWeight: 600, color: '#64748b', cursor: 'pointer', fontSize: '0.95rem'
                            }}
                        >
                            {readOnly ? 'Close' : 'Cancel'}
                        </button>
                        {!readOnly && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    height: '48px', padding: '0 1.5rem', borderRadius: '12px',
                                    border: 'none', background: 'var(--primary-color)', color: 'white',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem',
                                    boxShadow: '0 4px 12px rgba(124, 76, 44, 0.25)'
                                }}
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> :
                                    isEditMode ? <Save size={18} /> : <UserPlus size={18} />}
                                {isEditMode ? 'Save Changes' : 'Save Employee'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
