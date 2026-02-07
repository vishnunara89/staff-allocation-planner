"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { StaffMember, Venue, Role } from '@/types';
import styles from './staff.module.css';
import {
    extractPhone,
    updatePhoneInNotes,
    exportToCSV,
    downloadCSVTemplate
} from '@/lib/staff-utils';

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterVenue, setFilterVenue] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Tag Entry Temp State
    const [tempSkill, setTempSkill] = useState('');
    const [tempLang, setTempLang] = useState('');
    const [tempLangLevel, setTempLangLevel] = useState('good');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [staffData, venuesData, rolesData] = await Promise.all([
                fetch('/api/staff').then(r => r.json()),
                fetch('/api/venues').then(r => r.json()),
                fetch('/api/roles').then(r => r.json())
            ]);
            setStaff(staffData);
            setVenues(venuesData);
            setRoles(rolesData);
        } catch (err) {
            console.error('Failed to fetch staff data:', err);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id?: number) => venues.find(v => v.id === id)?.name || '-';
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || '-';

    const filteredStaff = staff.filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = !filterRole || s.primary_role_id === Number(filterRole);
        const matchesVenue = !filterVenue || s.home_base_venue_id === Number(filterVenue);
        const matchesStatus = !filterStatus || s.availability_status === filterStatus;
        return matchesSearch && matchesRole && matchesVenue && matchesStatus;
    });

    async function handleStatusChange(member: StaffMember, newStatus: string) {
        try {
            const res = await fetch(`/api/staff/${member.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...member,
                    availability_status: newStatus
                })
            });
            if (res.ok) {
                setStaff(staff.map(s => s.id === member.id ? { ...s, availability_status: newStatus as any } : s));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    }

    const emptyStaff: Partial<StaffMember> = {
        full_name: '',
        primary_role_id: roles[0]?.id || 1,
        secondary_roles: [],
        english_proficiency: 'good',
        other_languages: {},
        special_skills: [],
        experience_tags: [],
        employment_type: 'internal',
        availability_status: 'available',
        notes: ''
    };

    function openAddModal() {
        setModalMode('add');
        setEditingStaff({ ...emptyStaff as StaffMember });
        setIsModalOpen(true);
    }

    function openEditModal(member: StaffMember) {
        setModalMode('edit');
        setEditingStaff({ ...member });
        setIsModalOpen(true);
    }

    async function handleModalSubmit(e: FormEvent) {
        e.preventDefault();
        if (!editingStaff) return;

        setSubmitting(true);
        try {
            const method = modalMode === 'add' ? 'POST' : 'PUT';
            const url = modalMode === 'add' ? '/api/staff' : `/api/staff/${editingStaff.id}`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingStaff)
            });

            if (res.ok) {
                const updated = await res.json();
                if (modalMode === 'add') {
                    setStaff([...staff, updated]);
                } else {
                    setStaff(staff.map(s => s.id === updated.id ? updated : s));
                }
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to save staff:', err);
            alert('Error saving staff member');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeleteStaff() {
        if (!editingStaff) return;
        if (!confirm(`Are you sure you want to delete ${editingStaff.full_name}?`)) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/staff/${editingStaff.id}`, { method: 'DELETE' });
            if (res.ok) {
                setStaff(staff.filter(s => s.id !== editingStaff.id));
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error('Failed to delete staff:', err);
            alert('Error deleting staff member');
        } finally {
            setSubmitting(false);
        }
    }

    // Tag Helpers
    const addSkill = () => {
        if (!tempSkill.trim() || !editingStaff) return;
        if (editingStaff.special_skills?.includes(tempSkill.trim())) return;
        setEditingStaff({
            ...editingStaff,
            special_skills: [...(editingStaff.special_skills || []), tempSkill.trim()]
        });
        setTempSkill('');
    };

    const removeSkill = (skill: string) => {
        if (!editingStaff) return;
        setEditingStaff({
            ...editingStaff,
            special_skills: (editingStaff.special_skills || []).filter(s => s !== skill)
        });
    };

    const addLanguage = () => {
        if (!tempLang.trim() || !editingStaff) return;
        setEditingStaff({
            ...editingStaff,
            other_languages: { ...editingStaff.other_languages, [tempLang.trim()]: tempLangLevel }
        });
        setTempLang('');
    };

    const removeLanguage = (lang: string) => {
        if (!editingStaff) return;
        const newLangs = { ...editingStaff.other_languages };
        delete newLangs[lang];
        setEditingStaff({ ...editingStaff, other_languages: newLangs });
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.emptyState}>Loading staff roster...</div></div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Staff Roster</h2>
                    <p>Manage fleet and individual availability levels.</p>
                </div>
                <div className={styles.actions}>
                    <button onClick={downloadCSVTemplate} className={styles.buttonSecondary}>Template</button>
                    <button onClick={() => exportToCSV(filteredStaff, roles, venues)} className={styles.buttonSecondary}>Export CSV</button>
                    <Link href="/staff/import" className={styles.buttonSecondary}>Import</Link>
                    <button onClick={openAddModal} className={styles.buttonPrimary}>+ Add Staff</button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <div className={styles.searchInputWrapper}>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={filterVenue} onChange={e => setFilterVenue(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Home Bases</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.filterSelect}>
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="off">Off</option>
                    <option value="leave">Leave</option>
                </select>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Home Base</th>
                            <th>English</th>
                            <th>Status</th>
                            <th>Type</th>
                            <th>Contact</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.map(s => {
                            const phone = extractPhone(s.notes);
                            return (
                                <tr key={s.id}>
                                    <td data-label="Name">
                                        <div className={styles.staffNameWrapper}>
                                            <div className={styles.staffName}>{s.full_name}</div>
                                            <div className={styles.tagCloud}>
                                                {s.english_proficiency && <span className={`${styles.tag} ${styles.tagLanguage}`}>EN: {s.english_proficiency}</span>}
                                                {Object.entries(s.other_languages || {}).map(([lang, level]) => (
                                                    <span key={lang} className={`${styles.tag} ${styles.tagLanguage}`}>{lang}: {level}</span>
                                                ))}
                                                {(s.special_skills || []).map(skill => (
                                                    <span key={skill} className={`${styles.tag} ${styles.tagSkill}`}>{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Role">{getRoleName(s.primary_role_id)}</td>
                                    <td data-label="Home Base">{getVenueName(s.home_base_venue_id)}</td>
                                    <td data-label="English">{s.english_proficiency}</td>
                                    <td data-label="Status">
                                        <select
                                            value={s.availability_status}
                                            onChange={e => handleStatusChange(s, e.target.value)}
                                            className={`${styles.statusSelect} ${styles['status-' + s.availability_status]}`}
                                        >
                                            <option value="available">Available</option>
                                            <option value="off">Off</option>
                                            <option value="leave">Leave</option>
                                        </select>
                                    </td>
                                    <td data-label="Type">{s.employment_type}</td>
                                    <td data-label="Contact">
                                        <div className={styles.contactCell}>
                                            <a
                                                href={phone ? `tel:${phone}` : '#'}
                                                className={`${styles.iconButton} ${!phone ? styles.disabled : ''}`}
                                                title={phone || "Add phone in Edit"}
                                            >
                                                📞
                                            </a>
                                            <a
                                                href={phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`${styles.iconButton} ${styles.whatsapp} ${!phone ? styles.disabled : ''}`}
                                                title={phone || "Add phone in Edit"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.6-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </td>
                                    <td data-label="Actions" style={{ textAlign: 'right' }}>
                                        <button onClick={() => openEditModal(s)} className={styles.buttonAction}>Edit</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredStaff.length === 0 && (
                    <div className={styles.emptyState}>No staff matches your filters.</div>
                )}
            </div>

            {/* Staff Modal (Add / Edit) */}
            {isModalOpen && editingStaff && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>{modalMode === 'add' ? 'Add New Staff' : 'Edit Staff Member'}</h3>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleModalSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label>Full Name</label>
                                        <input
                                            className={styles.formInput}
                                            value={editingStaff.full_name}
                                            onChange={e => setEditingStaff({ ...editingStaff, full_name: e.target.value })}
                                            required
                                            placeholder="e.g. Liam Thompson"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Primary Role</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editingStaff.primary_role_id}
                                            onChange={e => setEditingStaff({ ...editingStaff, primary_role_id: Number(e.target.value) })}
                                        >
                                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Home Base</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editingStaff.home_base_venue_id || ''}
                                            onChange={e => setEditingStaff({ ...editingStaff, home_base_venue_id: e.target.value ? Number(e.target.value) : undefined })}
                                        >
                                            <option value="">No Home Base</option>
                                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>English Proficiency</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editingStaff.english_proficiency}
                                            onChange={e => setEditingStaff({ ...editingStaff, english_proficiency: e.target.value as any })}
                                        >
                                            <option value="basic">Basic</option>
                                            <option value="medium">Medium</option>
                                            <option value="good">Good</option>
                                            <option value="fluent">Fluent</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number</label>
                                        <input
                                            className={styles.formInput}
                                            value={extractPhone(editingStaff.notes) || ''}
                                            placeholder="+971..."
                                            onChange={e => setEditingStaff({
                                                ...editingStaff,
                                                notes: updatePhoneInNotes(editingStaff.notes, e.target.value)
                                            })}
                                        />
                                    </div>

                                    {/* Skills Tag Entry */}
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label>Special Skills</label>
                                        <div className={styles.tagEntryContainer}>
                                            <div className={styles.tagInputWrapper}>
                                                <input
                                                    type="text"
                                                    placeholder="Add skill (e.g. Bartender, Driver)"
                                                    value={tempSkill}
                                                    onChange={e => setTempSkill(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                                />
                                                <button type="button" onClick={addSkill} className={styles.tagAddButton}>Add</button>
                                            </div>
                                            <div className={styles.activeTags}>
                                                {(editingStaff.special_skills || []).map(skill => (
                                                    <span key={skill} className={`${styles.editableTag} ${styles.skillTag}`}>
                                                        {skill}
                                                        <button type="button" onClick={() => removeSkill(skill)} className={styles.removeTagBtn}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Language Tag Entry */}
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label>Other Languages</label>
                                        <div className={styles.tagEntryContainer}>
                                            <div className={styles.langEntryWrapper}>
                                                <input
                                                    type="text"
                                                    placeholder="Language (e.g. Arabic)"
                                                    value={tempLang}
                                                    onChange={e => setTempLang(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                                                />
                                                <select value={tempLangLevel} onChange={e => setTempLangLevel(e.target.value)} className={styles.langSelect}>
                                                    <option value="basic">Basic</option>
                                                    <option value="medium">Medium</option>
                                                    <option value="good">Good</option>
                                                    <option value="fluent">Fluent</option>
                                                </select>
                                                <button type="button" onClick={addLanguage} className={styles.tagAddButton}>Add</button>
                                            </div>
                                            <div className={styles.activeTags}>
                                                {Object.entries(editingStaff.other_languages || {}).map(([lang, level]) => (
                                                    <span key={lang} className={`${styles.editableTag} ${styles.langTag}`}>
                                                        {lang}: {level}
                                                        <button type="button" onClick={() => removeLanguage(lang)} className={styles.removeTagBtn}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Employment Type</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editingStaff.employment_type}
                                            onChange={e => setEditingStaff({ ...editingStaff, employment_type: e.target.value as any })}
                                        >
                                            <option value="internal">Internal</option>
                                            <option value="external">External</option>
                                            <option value="freelancer">Freelancer</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Availability Status</label>
                                        <select
                                            className={styles.formSelect}
                                            value={editingStaff.availability_status}
                                            onChange={e => setEditingStaff({ ...editingStaff, availability_status: e.target.value as any })}
                                        >
                                            <option value="available">Available</option>
                                            <option value="off">Off</option>
                                            <option value="leave">Leave</option>
                                        </select>
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label>Notes</label>
                                        <textarea
                                            className={styles.formTextarea}
                                            rows={2}
                                            value={(editingStaff.notes || '').replace(/Phone:.*(\n|$)/i, '').trim()}
                                            placeholder="General notes..."
                                            onChange={e => {
                                                const currentPhone = extractPhone(editingStaff.notes) || '';
                                                const baseNotes = e.target.value;
                                                setEditingStaff({
                                                    ...editingStaff,
                                                    notes: currentPhone ? `${baseNotes}\nPhone:${currentPhone}` : baseNotes
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                {modalMode === 'edit' && (
                                    <div className={styles.modalFooterLeft}>
                                        <button
                                            type="button"
                                            className={styles.buttonDelete}
                                            onClick={handleDeleteStaff}
                                            disabled={submitting}
                                        >
                                            Delete Staff
                                        </button>
                                    </div>
                                )}
                                <button type="button" className={styles.buttonSecondary} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.buttonPrimary} disabled={submitting}>
                                    {submitting ? 'Saving...' : (modalMode === 'add' ? 'Add Staff member' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
