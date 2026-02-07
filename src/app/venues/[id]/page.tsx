"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Venue, StaffingRule, Role } from '@/types';
import styles from './venue-detail.module.css';

export default function VenueDetailPage({ params }: { params: { id: string } }) {
    const [venue, setVenue] = useState<Venue | null>(null);
    const [rules, setRules] = useState<StaffingRule[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAddRule, setShowAddRule] = useState(false);
    const [newRule, setNewRule] = useState<Partial<StaffingRule>>({
        department: 'service',
        ratio_guests: 10,
        ratio_staff: 1
    });

    const [activeTab, setActiveTab] = useState<'current' | 'excel'>('current');
    const [deptFilter, setDeptFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    // Mmoved from below to avoid conditional hook call error
    const [brackets, setBrackets] = useState<any[]>([]);
    const [bracketDept, setBracketDept] = useState<string>('service');
    const [loadingBrackets, setLoadingBrackets] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState('');

    useEffect(() => {
        Promise.all([
            fetch(`/api/venues/${params.id}`).then(r => r.json()),
            fetch(`/api/rules?venue_id=${params.id}`).then(r => r.json()),
            fetch('/api/roles').then(r => r.json())
        ]).then(([venueData, rulesData, rolesData]) => {
            if (venueData.error) throw new Error(venueData.error);
            setVenue(venueData);
            setRules(rulesData);
            setRoles(rolesData);
        }).catch(err => {
            setError('Failed to load venue data');
            console.error(err);
        }).finally(() => setLoading(false));
    }, [params.id]);

    useEffect(() => {
        if (activeTab === 'excel') {
            loadBrackets();
        }
    }, [activeTab, bracketDept, params.id]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Venue>>({});
    const router = useRouter();

    async function handleUpdateVenue(e: FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch(`/api/venues/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const updated = await res.json();
            if (updated.error) throw new Error(updated.error);
            setVenue({ ...venue, ...updated } as Venue);
            setIsEditing(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update venue');
        }
    }

    async function handleDeleteVenue() {
        if (!confirm('Are you sure you want to delete this venue? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/venues/${params.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            router.push('/venues');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleAddRule(e: FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_id: Number(params.id),
                    ...newRule
                })
            });
            const savedRule = await res.json();
            if (savedRule.error) throw new Error(savedRule.error);

            setRules([...rules, savedRule]);
            setShowAddRule(false);
            setNewRule({ department: 'service', ratio_guests: 10, ratio_staff: 1 }); // reset
        } catch (err) {
            alert('Failed to save rule');
            console.error(err);
        }
    }

    async function handleDeleteRule(id: number) {
        if (!confirm('Delete this rule?')) return;
        try {
            await fetch(`/api/rules/${id}`, { method: 'DELETE' });
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    function getRoleName(id: number) {
        if (!roles || roles.length === 0) return 'Loading...';
        const role = roles.find(r => r.id === id);
        return role ? role.name : `Unknown Role (${id})`;
    }

    const filteredRules = rules.filter(r => {
        const matchesDept = deptFilter === 'all' || r.department === deptFilter;
        const roleName = getRoleName(r.role_id).toLowerCase();
        const matchesSearch = roleName.includes(searchQuery.toLowerCase());
        return matchesDept && matchesSearch;
    });

    if (loading) return <div className={styles.loading}>Loading venue details...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!venue) return <div className={styles.error}>Venue not found</div>;

    async function loadBrackets() {
        setLoadingBrackets(true);
        try {
            const res = await fetch(`/api/manning-brackets?venue_id=${params.id}&department=${bracketDept}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setBrackets(data);
            } else {
                setBrackets([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBrackets(false);
        }
    }

    function handleAddBracket() {
        const lastMax = brackets.length > 0 ? brackets[brackets.length - 1].guest_max : 0;
        setBrackets([
            ...brackets,
            {
                guest_min: lastMax + 1,
                guest_max: lastMax + 20,
                counts: {},
                notes: ''
            }
        ]);
    }

    function updateBracket(index: number, field: string, value: any, roleId?: number) {
        const newBrackets = [...brackets];
        if (roleId !== undefined) {
            const counts = { ...(newBrackets[index].counts || {}) };
            counts[roleId] = Number(value);
            newBrackets[index] = { ...newBrackets[index], counts };
        } else {
            newBrackets[index] = { ...newBrackets[index], [field]: value };
        }
        setBrackets(newBrackets);
    }

    function removeBracket(index: number) {
        setBrackets(brackets.filter((_, i) => i !== index));
    }

    async function handleSaveBrackets() {
        setSaveFeedback('Saving...');
        try {
            const res = await fetch('/api/manning-brackets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_id: Number(params.id),
                    department: bracketDept,
                    brackets: brackets
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setSaveFeedback('Saved successfully!');
            setTimeout(() => setSaveFeedback(''), 3000);
        } catch (err) {
            alert('Failed to save brackets');
            setSaveFeedback('');
        }
    }

    const deptRoles = roles.filter(r => {
        const cat = r.category?.toLowerCase() || 'other';
        const dept = bracketDept.toLowerCase();
        return dept === 'all' || cat.includes(dept) || (dept === 'service' && cat === 'service') || (dept === 'bar' && cat === 'bar');
    });

    // Fallback: if no roles found for category, show all or show warning
    const safeDeptRoles = deptRoles.length > 0 ? deptRoles : roles;

    return (
        <div className={styles.container}>
            <header className={styles.stickyHeader}>
                <div className={styles.headerTop}>
                    <a href="/venues" className={styles.backLink}>← Back to Venues</a>
                    <div className={styles.headerActions}>
                        <button onClick={() => {
                            setEditForm(venue);
                            setIsEditing(true);
                        }} className={styles.buttonSecondary}>Edit Venue</button>
                        <button onClick={handleDeleteVenue} className={styles.buttonDanger}>Delete</button>
                    </div>
                </div>

                {isEditing ? (
                    <div className={styles.editFormContainer}>
                        <form onSubmit={handleUpdateVenue} className={styles.editForm}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Venue Name</label>
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Type</label>
                                    <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as any })} className={styles.select}>
                                        <option value="camp">Camp</option>
                                        <option value="private">Private</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <button type="submit" className={styles.buttonPrimary}>Save</button>
                                <button type="button" onClick={() => setIsEditing(false)} className={styles.buttonSecondary}>Cancel</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className={styles.headerTitleRow}>
                        <h1 className={styles.title}>{venue.name}</h1>
                        <div className={styles.badges}>
                            <span className={styles.badge}>{venue.type}</span>
                            <span className={styles.badgeOutline}>{venue.default_service_style}</span>
                        </div>
                    </div>
                )}

                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'current' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('current')}
                    >
                        Rules (Current)
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'excel' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('excel')}
                    >
                        Excel Rules (Pax Brackets)
                    </button>
                </div>
            </header>

            <div className={styles.content}>
                {activeTab === 'current' ? (
                    <div className={styles.rulesWorkspace}>
                        {/* ... Existing Rules Table ... */}
                        <div className={styles.controlsToolbar}>
                            <div className={styles.filters}>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="all">All Departments</option>
                                    <option value="service">Service</option>
                                    <option value="bar">Bar</option>
                                    <option value="management">Management</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Search roles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                />
                            </div>
                            <button onClick={() => setShowAddRule(true)} className={styles.buttonPrimary}>
                                + Add Rule
                            </button>
                        </div>

                        <div className={styles.tableContainer}>
                            <table className={styles.rulesTable}>
                                <thead>
                                    <tr>
                                        <th>Dept</th>
                                        <th>Role</th>
                                        <th>Ratio (Guests/Staff)</th>
                                        <th>Min Required</th>
                                        <th>Threshold</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRules.map(rule => (
                                        <tr key={rule.id}>
                                            <td><span className={styles.deptTag}>{rule.department}</span></td>
                                            <td className={styles.roleCell}>{getRoleName(rule.role_id)}</td>
                                            <td>1 per <strong>{rule.ratio_guests}</strong></td>
                                            <td>{rule.min_required || '-'}</td>
                                            <td>{rule.threshold_guests ? `> ${rule.threshold_guests}` : '-'}</td>
                                            <td>
                                                <button onClick={() => handleDeleteRule(rule.id)} className={styles.iconButton} title="Delete">
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRules.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className={styles.emptyCell}>
                                                No rules found matching your filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className={styles.bracketsEditor}>
                        <div className={styles.editorHeader}>
                            <div className={styles.deptSwitcher}>
                                <label>Department:</label>
                                <select
                                    value={bracketDept}
                                    onChange={e => setBracketDept(e.target.value)}
                                    className={styles.select}
                                    style={{ width: 'auto' }}
                                >
                                    <option value="service">Service</option>
                                    <option value="bar">Bar</option>
                                    <option value="management">Management</option>
                                    <option value="housekeeping">Housekeeping</option>
                                    <option value="kitchen">Kitchen</option>
                                </select>
                            </div>
                            <div>
                                {saveFeedback && <span className={styles.bracketFeedback}>{saveFeedback}</span>}
                            </div>
                        </div>

                        {loadingBrackets ? (
                            <div className={styles.loading}>Loading brackets...</div>
                        ) : (
                            <div className={styles.tableContainer}>
                                <table className={styles.bracketsTable}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '80px' }}>Min Pax</th>
                                            <th style={{ width: '80px' }}>Max Pax</th>
                                            {safeDeptRoles.map(r => (
                                                <th key={r.id}>{r.name}</th>
                                            ))}
                                            <th>Notes</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brackets.map((bracket, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.inputSmall}
                                                        value={bracket.guest_min}
                                                        onChange={e => updateBracket(index, 'guest_min', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className={styles.inputSmall}
                                                        value={bracket.guest_max}
                                                        onChange={e => updateBracket(index, 'guest_max', e.target.value)}
                                                    />
                                                </td>
                                                {safeDeptRoles.map(r => (
                                                    <td key={r.id}>
                                                        <input
                                                            type="number"
                                                            className={styles.inputSmall}
                                                            value={bracket.counts?.[r.id] || 0}
                                                            onChange={e => updateBracket(index, 'counts', e.target.value, r.id)}
                                                            style={{ backgroundColor: (bracket.counts?.[r.id] > 0) ? '#e3f2fd' : 'white' }}
                                                        />
                                                    </td>
                                                ))}
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.inputNote}
                                                        value={bracket.notes || ''}
                                                        placeholder="Optional notes"
                                                        onChange={e => updateBracket(index, 'notes', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <button onClick={() => removeBracket(index)} className={styles.deleteBtn}>×</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className={styles.editorFooter}>
                                    <button onClick={handleAddBracket} className={styles.buttonSecondary}>+ Add Pax Range</button>
                                    <button onClick={handleSaveBrackets} className={styles.buttonPrimary}>Save Changes</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal for Add Rule */}
            {showAddRule && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h3>Add Staffing Rule</h3>
                        <form onSubmit={handleAddRule}>
                            <div className={styles.formGroup}>
                                <label>Department</label>
                                <select
                                    value={newRule.department}
                                    onChange={e => setNewRule({ ...newRule, department: e.target.value as any })}
                                    className={styles.select}
                                >
                                    <option value="service">Service</option>
                                    <option value="bar">Bar</option>
                                    <option value="management">Management</option>
                                </select>
                            </div>
                            {/* ... reuse existing form fields ... */}
                            <div className={styles.formGroup}>
                                <label>Role</label>
                                <select
                                    required
                                    value={newRule.role_id || ''}
                                    onChange={e => setNewRule({ ...newRule, role_id: Number(e.target.value) })}
                                    className={styles.select}
                                >
                                    <option value="">Select Role...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>1 Staff Per (Guests)</label>
                                    <input type="number" value={newRule.ratio_guests} onChange={e => setNewRule({ ...newRule, ratio_guests: Number(e.target.value) })} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Min Required</label>
                                    <input type="number" value={newRule.min_required || ''} onChange={e => setNewRule({ ...newRule, min_required: Number(e.target.value) })} className={styles.input} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Threshold (Guests)</label>
                                <input type="number" value={newRule.threshold_guests || ''} onChange={e => setNewRule({ ...newRule, threshold_guests: Number(e.target.value) })} className={styles.input} />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowAddRule(false)} className={styles.buttonSecondary}>Cancel</button>
                                <button type="submit" className={styles.buttonPrimary}>Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
