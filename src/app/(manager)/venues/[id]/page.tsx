"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Venue, StaffingRule, Role } from '@/types';
import { MANNING_TEMPLATES, ManningTemplate } from '@/lib/manningTemplates';
import styles from './venue-detail.module.css';

interface ManningConfig {
    brackets: string[];
    rows: { role: string; counts: number[] }[];
}

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

    // Manning Rules Excel Editor State
    const [selectedTemplate, setSelectedTemplate] = useState<string>('Custom');
    const [manningDept, setManningDept] = useState<string>('all');
    const [manningConfig, setManningConfig] = useState<ManningConfig>({ brackets: ['0-50'], rows: [] });
    const [savingManning, setSavingManning] = useState(false);
    const [manningFeedback, setManningFeedback] = useState('');
    const [availableDepts, setAvailableDepts] = useState<string[]>(['all']);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Venue>>({});
    const router = useRouter();

    useEffect(() => {
        Promise.all([
            fetch(`/api/venues/${params.id}`).then(r => r.json()),
            fetch(`/api/rules?venue_id=${params.id}`).then(r => r.json()),
            fetch('/api/roles').then(r => r.json())
        ]).then(([venueData, rulesData, rolesData]) => {
            if (venueData.error) throw new Error(venueData.error);
            setVenue(venueData);
            setRules(Array.isArray(rulesData) ? rulesData : []);
            setRoles(rolesData);

            // Set dynamic title
            if (venueData.name) {
                document.title = `${venueData.name} | NARA Intelligence`;
            }
        }).catch(err => {
            setError('Failed to load venue data');
            console.error(err);
        }).finally(() => setLoading(false));
    }, [params.id]);

    // Load saved manning tables when switching to excel tab
    useEffect(() => {
        if (activeTab === 'excel') {
            loadManningTables();
        }
    }, [activeTab, params.id]);

    async function loadManningTables() {
        try {
            const res = await fetch(`/api/manning-tables?venue_id=${params.id}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                // Load the first department's config
                const first = data[0];
                setManningConfig(first.config);
                setManningDept(first.department);
                setSelectedTemplate('Custom'); // Saved data = custom
            }
        } catch (err) {
            console.error('Failed to load manning tables:', err);
        }
    }

    function handleLoadTemplate() {
        const template = MANNING_TEMPLATES.find(t => t.name === selectedTemplate);
        if (!template) return;

        setAvailableDepts(template.departments);
        const firstDept = template.departments[0];
        setManningDept(firstDept);
        setManningConfig(template.configs[firstDept]);
    }

    function handleDeptChange(dept: string) {
        setManningDept(dept);
        const template = MANNING_TEMPLATES.find(t => t.name === selectedTemplate);
        if (template && template.configs[dept]) {
            setManningConfig(template.configs[dept]);
        }
    }

    async function handleSaveManning() {
        setSavingManning(true);
        setManningFeedback('');
        try {
            const res = await fetch('/api/manning-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_id: Number(params.id),
                    department: manningDept,
                    config: manningConfig
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setManningFeedback('Saved!');
            setTimeout(() => setManningFeedback(''), 3000);
        } catch (err) {
            setManningFeedback('Failed to save');
        } finally {
            setSavingManning(false);
        }
    }

    function updateCell(rowIndex: number, colIndex: number, value: number) {
        const newConfig = { ...manningConfig };
        newConfig.rows = [...newConfig.rows];
        newConfig.rows[rowIndex] = {
            ...newConfig.rows[rowIndex],
            counts: [...newConfig.rows[rowIndex].counts]
        };
        newConfig.rows[rowIndex].counts[colIndex] = value;
        setManningConfig(newConfig);
    }

    function updateRoleName(rowIndex: number, name: string) {
        const newConfig = { ...manningConfig };
        newConfig.rows = [...newConfig.rows];
        newConfig.rows[rowIndex] = { ...newConfig.rows[rowIndex], role: name };
        setManningConfig(newConfig);
    }

    function addRole() {
        const newConfig = { ...manningConfig };
        newConfig.rows = [...newConfig.rows, {
            role: 'New Role',
            counts: new Array(newConfig.brackets.length).fill(0)
        }];
        setManningConfig(newConfig);
    }

    function removeRole(index: number) {
        if (!confirm('Remove this role?')) return;
        const newConfig = { ...manningConfig };
        newConfig.rows = newConfig.rows.filter((_, i) => i !== index);
        setManningConfig(newConfig);
    }

    function addBracket() {
        const lastBracket = manningConfig.brackets[manningConfig.brackets.length - 1] || '0-50';
        const parts = lastBracket.split('-');
        const lastMax = parseInt(parts[1]) || 50;
        const newBracket = `${lastMax}-${lastMax + 50}`;

        const newConfig = { ...manningConfig };
        newConfig.brackets = [...newConfig.brackets, newBracket];
        newConfig.rows = newConfig.rows.map(row => ({
            ...row,
            counts: [...row.counts, 0]
        }));
        setManningConfig(newConfig);
    }

    function removeBracket(index: number) {
        if (!confirm('Remove this PAX bracket?')) return;
        const newConfig = { ...manningConfig };
        newConfig.brackets = newConfig.brackets.filter((_, i) => i !== index);
        newConfig.rows = newConfig.rows.map(row => ({
            ...row,
            counts: row.counts.filter((_, i) => i !== index)
        }));
        setManningConfig(newConfig);
    }

    function updateBracket(index: number, value: string) {
        const newConfig = { ...manningConfig };
        newConfig.brackets = [...newConfig.brackets];
        newConfig.brackets[index] = value;
        setManningConfig(newConfig);
    }

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
            setNewRule({ department: 'service', ratio_guests: 10, ratio_staff: 1 });
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
                        Manning Rules (Excel)
                    </button>
                </div>
            </header>

            <div className={styles.content}>
                {activeTab === 'current' ? (
                    <div className={styles.rulesWorkspace}>
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
                    <div className={styles.manningEditor}>
                        <div className={styles.manningHeader}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-cormorant), serif' }}>Manning Rules</h3>
                        </div>

                        {/* Department tabs */}
                        <div className={styles.deptTabs}>
                            {['service', 'bar', 'management'].map(dept => (
                                <button
                                    key={dept}
                                    className={`${styles.deptTab} ${manningDept === dept ? styles.activeDeptTab : ''}`}
                                    onClick={() => handleDeptChange(dept)}
                                >
                                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Excel-like grid (READ ONLY) */}
                        <div className={styles.excelGridContainer}>
                            <table className={styles.excelGrid}>
                                <thead>
                                    <tr>
                                        <th className={styles.stickyCol}>Role</th>
                                        {manningConfig.brackets.map((bracket, idx) => (
                                            <th key={idx} className={styles.bracketHeader}>
                                                <div className={styles.bracketText}>{bracket}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {manningConfig.rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={manningConfig.brackets.length + 1} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                                No specific rules defined for {manningDept} in this venue yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        manningConfig.rows.map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                                <td className={styles.stickyCol}>
                                                    <div className={styles.roleLabel}>{row.role}</div>
                                                </td>
                                                {row.counts.map((count, colIdx) => (
                                                    <td key={colIdx}>
                                                        <div className={styles.countDisplay}>{count}</div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
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
