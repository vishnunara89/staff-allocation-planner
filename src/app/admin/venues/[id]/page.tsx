"use client";

import { useState, useEffect } from "react";
import {
    MapPin,
    Users,
    Settings,
    Calendar,
    ArrowLeft,
    Plus,
    FileText,
    Database,
    Shield,
    Loader2,
    Trash2,
    Save,
    RotateCcw,
    Pencil,
    Check,
    X,
    ChevronRight,
    Clock,
    ChevronUp,
    ChevronDown
} from "lucide-react";
import styles from "../venues.module.css";
import Link from "next/link";

interface VenueDetailProps {
    params: { id: string };
}

type TabType = 'Overview' | 'Staffing Rules';

const MOCK_ACTIVITY = [
    {
        manager_name: "John Smith",
        action: "Updated staffing rule",
        details: "Changed Waiter count from 2 to 4 for 50-100 PAX bracket",
        reason: "Expectation of high weekend footfall",
        timestamp: "10 Feb, 14:30"
    },
    {
        manager_name: "Sarah Chen",
        action: "Venue Detail Update",
        details: "Modified Venue Type from 'other' to 'restaurant'",
        reason: "Re-classification for reporting",
        timestamp: "09 Feb, 11:20"
    },
    {
        manager_name: "Emma Wilson",
        action: "Staffing Table Deletion",
        details: "Removed 'Outdoor Bar' staffing rules",
        reason: "Venue area closed for seasonal maintenance",
        timestamp: "08 Feb, 16:45"
    }
];

export default function AdminVenueDetailPage({ params }: VenueDetailProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [venue, setVenue] = useState<any>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [manningTables, setManningTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit Venue State
    const [editingVenue, setEditingVenue] = useState(false);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState('');

    // Assigned Managers & Activity Log
    const [assignedManagers, setAssignedManagers] = useState<any[]>([]);
    const [activityLog, setActivityLog] = useState<any[]>([]);

    // Roles & Skills for Manning Rules
    const [roles, setRoles] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);

    // Add Role/Skill State
    const [newRole, setNewRole] = useState("");
    const [newSkill, setNewSkill] = useState("");

    // Default PAX brackets (0-100 in steps of 10)
    const DEFAULT_BRACKETS = [
        '0-10', '10-20', '20-30', '30-40', '40-50',
        '50-60', '60-70', '70-80', '80-90', '90-100'
    ];

    // Manning Rules Excel Editor State
    const [manningConfig, setManningConfig] = useState<any>({ brackets: DEFAULT_BRACKETS, rows: [] });
    const [savingManning, setSavingManning] = useState(false);
    const [manningFeedback, setManningFeedback] = useState('');

    useEffect(() => {
        async function fetchVenueData() {
            setLoading(true);
            try {
                const [venueRes, rulesRes, tablesRes] = await Promise.all([
                    fetch(`/api/venues/${params.id}`),
                    fetch(`/api/rules?venue_id=${params.id}`),
                    fetch(`/api/manning-tables?venue_id=${params.id}`)
                ]);

                if (venueRes.ok) {
                    const vData = await venueRes.json();
                    setVenue(vData);
                    if (vData.name) {
                        document.title = `${vData.name} (Admin) | NARA Pulse`;
                    }
                }
                if (rulesRes.ok) {
                    const rData = await rulesRes.json();
                    setRules(Array.isArray(rData) ? rData : []);
                }
                if (tablesRes.ok) {
                    const tData = await tablesRes.json();
                    setManningTables(Array.isArray(tData) ? tData : []);

                    // Pre-load first available table into editor, or use default brackets
                    if (Array.isArray(tData) && tData.length > 0) {
                        setManningConfig(tData[0].config);
                    } else {
                        setManningConfig({ brackets: DEFAULT_BRACKETS, rows: [] });
                    }
                }

                // Fetch assigned managers
                try {
                    const managersRes = await fetch('/api/managers');
                    if (managersRes.ok) {
                        const allManagers = await managersRes.json();
                        const assignedManagers = Array.isArray(allManagers)
                            ? allManagers.filter((m: any) => m.venueIds?.includes(Number(params.id)))
                            : [];
                        setAssignedManagers(assignedManagers);
                    }
                } catch (error) {
                    console.error('Failed to fetch managers:', error);
                }

                // Fetch roles
                try {
                    const rolesRes = await fetch('/api/roles');
                    if (rolesRes.ok) {
                        const rolesData = await rolesRes.json();
                        setRoles(Array.isArray(rolesData) ? rolesData : []);
                    }
                } catch (error) {
                    console.error('Failed to fetch roles:', error);
                }

                // Fetch skills (New)
                try {
                    const skillsRes = await fetch('/api/skills');
                    if (skillsRes.ok) {
                        const skillsData = await skillsRes.json();
                        setSkills(Array.isArray(skillsData) ? skillsData : []);
                    }
                } catch (error) {
                    console.error('Failed to fetch skills:', error);
                }

                // Try to fetch activity log (API doesn't exist yet - using MOCK for UX)
                try {
                    const activityRes = await fetch(`/api/activity?venue_id=${params.id}`);
                    if (activityRes.ok) {
                        const activityData = await activityRes.json();
                        setActivityLog(Array.isArray(activityData) && activityData.length > 0 ? activityData : MOCK_ACTIVITY);
                    } else {
                        setActivityLog(MOCK_ACTIVITY);
                    }
                } catch {
                    setActivityLog(MOCK_ACTIVITY);
                }
            } catch (error) {
                console.error("Failed to fetch venue details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchVenueData();
    }, [params.id]);

    /* ==============================
       ADD ROLE & SKILL HELPERS
    ============================== */
    const handleAddRole = async () => {
        if (!newRole.trim()) return;

        try {
            const res = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRole.trim() })
            });

            if (res.ok) {
                const updated = await fetch("/api/roles");
                setRoles(await updated.json());
                setNewRole("");
            } else {
                alert("Role already exists or failed");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;

        try {
            const res = await fetch("/api/skills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newSkill.trim() })
            });

            if (res.ok) {
                const updated = await fetch("/api/skills");
                setSkills(await updated.json());
                setNewSkill("");
            } else {
                alert("Skill already exists or failed");
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '8rem', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3>Loading operational data...</h3>
            </div>
        );
    }

    if (!venue) {
        return (
            <div style={{ padding: '8rem', textAlign: 'center' }}>
                <h3 style={{ color: '#e11d48' }}>Venue Not Found</h3>
                <Link href="/admin/venues" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Return to Venues</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Breadcrumb with venue name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <Link href="/admin/venues" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowLeft size={16} /> Venues / Camps
                </Link>
                <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{venue.name}</span>
            </div>

            <div className={styles.detailHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(124, 76, 44, 0.1)', color: 'var(--primary-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} />
                        </div>
                        {!editingVenue ? (
                            <div style={{ flex: 1 }}>
                                <span className={styles.venueType} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{venue.type}</span>
                                <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, margin: 0 }}>{venue.name}</h1>
                            </div>
                        ) : (
                            <div className={styles.editVenueForm} style={{ flex: 1 }}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Venue Name"
                                    style={{ flex: 1, maxWidth: '300px' }}
                                />
                                <select
                                    value={editType}
                                    onChange={e => setEditType(e.target.value)}
                                    style={{ width: '150px' }}
                                >
                                    <option value="camp">Camp</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="private">Private</option>
                                    <option value="other">Other</option>
                                </select>
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await fetch(`/api/venues/${params.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ name: editName, type: editType })
                                            });
                                            if (res.ok) {
                                                const updated = await res.json();
                                                setVenue(updated);
                                                setEditingVenue(false);
                                            }
                                        } catch (error) {
                                            console.error('Failed to update venue:', error);
                                        }
                                    }}
                                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => setEditingVenue(false)}
                                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f1f5f9', color: '#64748b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                    {!editingVenue && (
                        <button
                            className={styles.editVenueBtn}
                            onClick={() => {
                                setEditName(venue.name);
                                setEditType(venue.type);
                                setEditingVenue(true);
                            }}
                            title="Edit Venue"
                        >
                            <Pencil size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.tabs}>
                    {(['Overview', 'Staffing Rules'] as TabType[]).map((tab) => (
                        <div
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                </div>

                <div className={styles.tabContent}>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                            {/* TOP SECTION: Info/Stats (Left) + Manager/Activity (Right) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>
                                {/* LEFT COLUMN */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <section>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Venue Information</h4>
                                        <p style={{ color: '#64748b', lineHeight: 1.6 }}>{venue.notes || "No operational notes provided for this venue."}</p>
                                    </section>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                        {[
                                            { label: 'Rules Active', value: manningConfig.rows.length > 0 ? 'Yes' : 'No', icon: Settings },
                                            { label: 'Upcoming Events', value: '—', icon: Calendar },
                                            { label: 'Saved Tables', value: manningTables.length, icon: Database },
                                        ].map((stat, i) => (
                                            <div key={i} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                <stat.icon size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }} />
                                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Saved Rules Display (Moved to Left Column) */}
                                    <div className={styles.savedRulesSection} style={{ marginTop: '0' }}>
                                        <h4 className={styles.savedRulesTitle}>
                                            <Database size={18} /> Saved Staffing Rules
                                        </h4>
                                        {manningTables.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                                                No staffing rules configured yet.
                                            </p>
                                        ) : (
                                            manningTables.map((table: any, idx: number) => (
                                                <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                                    <div className={styles.savedTableSubtitle}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'capitalize' }}>
                                                            {table.department}
                                                        </div>
                                                        <button
                                                            className={styles.deleteTableBtn}
                                                            title="Delete Staffing Rule"
                                                            onClick={async () => {
                                                                if (!confirm(`Delete saved staffing rules for ${table.department}?`)) return;

                                                                // Local state update for smooth UX
                                                                setManningTables((prev: any[]) => prev.filter((_: any, i: number) => i !== idx));
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div className={styles.excelGridContainer}>
                                                        <table className={styles.savedRulesTable} style={{ minWidth: '100%' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th className={styles.stickyCol} style={{ background: '#f8fafc' }}>Role</th>
                                                                    <th className={styles.stickyCol} style={{ left: '160px', width: '150px', background: '#f8fafc' }}>Skill</th>
                                                                    {table.config.brackets?.map((bracket: string, i: number) => (
                                                                        <th key={i} style={{ minWidth: '80px' }}>{bracket} PAX</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {table.config.rows?.map((row: any, ri: number) => (
                                                                    <tr key={ri}>
                                                                        <td className={styles.stickyCol} style={{ background: 'white' }}>{row.role || '—'}</td>
                                                                        <td className={styles.stickyCol} style={{ left: '160px', background: 'white' }}>{row.skill || '—'}</td>
                                                                        {row.counts?.map((count: number, ci: number) => (
                                                                            <td key={ci}>{count}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Assigned Managers */}
                                    <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                        <h4 className={styles.sectionTitle}>
                                            <Shield size={18} /> Assigned Managers
                                        </h4>
                                        {assignedManagers.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                                No managers assigned to this venue yet.
                                            </p>
                                        ) : (
                                            assignedManagers.map((mgr: any) => (
                                                <div key={mgr.id} className={styles.managerCard}>
                                                    <div className={styles.managerAvatar}>
                                                        {mgr.name?.charAt(0)?.toUpperCase() || 'M'}
                                                    </div>
                                                    <div className={styles.managerInfo}>
                                                        <div className={styles.managerName}>{mgr.name}</div>
                                                        <div className={styles.managerPhone}>{mgr.phone || 'No phone'}</div>
                                                    </div>
                                                    <div className={styles.managerActions}>
                                                        {mgr.phone && (
                                                            <>
                                                                <a
                                                                    href={`https://wa.me/${mgr.phone.replace(/[^0-9]/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles.contactBtn}
                                                                    title="WhatsApp"
                                                                    style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366' }}
                                                                >
                                                                    💬
                                                                </a>
                                                                <a
                                                                    href={`tel:${mgr.phone}`}
                                                                    className={styles.contactBtn}
                                                                    title="Call"
                                                                    style={{ background: 'rgba(124, 76, 44, 0.08)', color: '#7C4C2C' }}
                                                                >
                                                                    📞
                                                                </a>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Activity Log */}
                                    <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                        <h4 className={styles.sectionTitle}>
                                            <Clock size={18} /> Recent Activity
                                        </h4>
                                        {activityLog.length === 0 ? (
                                            <div className={styles.emptyActivity}>
                                                <Clock size={32} style={{ opacity: 0.2, marginBottom: '0.75rem' }} />
                                                <p>No recent activity for this venue.</p>
                                                <p className={styles.emptySubtext}>
                                                    Rule changes by managers will appear here with details on what changed and why.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className={styles.activityList}>
                                                {activityLog.map((entry: any, i: number) => (
                                                    <div key={i} className={styles.activityItem}>
                                                        <div className={styles.activityDot} />
                                                        <div className={styles.activityContent}>
                                                            <div className={styles.activityHeader}>
                                                                <strong>{entry.manager_name}</strong>
                                                                <span className={styles.activityTime}>{entry.timestamp}</span>
                                                            </div>
                                                            <div className={styles.activityAction}>
                                                                {entry.action} — {entry.details}
                                                            </div>
                                                            {entry.reason && (
                                                                <div className={styles.activityReason}>
                                                                    <em>Reason:</em> "{entry.reason}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                        </div>
                    )}

                    {activeTab === 'Staffing Rules' && (
                        <div className={styles.manningEditor}>
                            {/* NEW: Add Role/Skill Inputs */}
                            <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem" }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        placeholder="Add Role"
                                        style={{ padding: "8px 12px", borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                    <button
                                        onClick={handleAddRole}
                                        style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '8px',
                                            background: '#f1f5f9', color: '#475569',
                                            border: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Add Skill"
                                        style={{ padding: "8px 12px", borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                    <button
                                        onClick={handleAddSkill}
                                        style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '8px',
                                            background: '#f1f5f9', color: '#475569',
                                            border: 'none',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                                <div className={styles.manningActions}>
                                    {manningFeedback && (
                                        <span className={styles.feedback} style={{ color: 'var(--success-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                                            {manningFeedback}
                                        </span>
                                    )}
                                    <button
                                        onClick={async () => {
                                            setSavingManning(true);
                                            setManningFeedback('');
                                            try {
                                                const res = await fetch('/api/manning-tables', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        venue_id: Number(params.id),
                                                        department: 'all',
                                                        config: manningConfig
                                                    })
                                                });
                                                if (res.ok) {
                                                    setManningFeedback('Staffing rules updated!');
                                                    setTimeout(() => setManningFeedback(''), 3000);
                                                }
                                            } catch (err) {
                                                setManningFeedback('Failed to sync');
                                            } finally {
                                                setSavingManning(false);
                                            }
                                        }}
                                        style={{
                                            background: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            height: '48px',
                                            padding: '0 2rem',
                                            borderRadius: '12px',
                                            fontWeight: 700,
                                            boxShadow: '0 4px 12px rgba(124, 76, 44, 0.15)',
                                            cursor: 'pointer'
                                        }}
                                        disabled={savingManning}
                                    >
                                        {savingManning ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {savingManning ? 'Syncing...' : 'Save Staffing Rules'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.excelGridContainer}>
                                <table className={styles.excelGrid}>
                                    <thead>
                                        <tr>
                                            <th className={styles.stickyTrash}></th>
                                            <th className={styles.stickyCol}>Role</th>
                                            <th className={styles.stickyColSkill}>Skill</th>
                                            {manningConfig.brackets.map((bracket: string, idx: number) => (
                                                <th key={idx} className={styles.bracketHeader}>
                                                    <span className={styles.bracketLabel}>{bracket}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (!confirm('Remove PAX bracket?')) return;
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.brackets = newConfig.brackets.filter((_: any, i: number) => i !== idx);
                                                            newConfig.rows = newConfig.rows.map((row: any) => ({
                                                                ...row,
                                                                counts: row.counts.filter((_: any, i: number) => i !== idx)
                                                            }));
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.removeBracketBtn}
                                                        title="Remove Bracket"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </th>
                                            ))}
                                            <th style={{ background: 'white', minWidth: '100px' }}>
                                                <button
                                                    onClick={() => {
                                                        const lastBracket = manningConfig.brackets[manningConfig.brackets.length - 1] || '0-10';
                                                        // Parse "90-100" -> 100
                                                        const parts = lastBracket.split('-');
                                                        const lastMax = parts.length === 2 ? parseInt(parts[1]) : 0;

                                                        // New bracket: 100-110
                                                        const newStart = lastMax;
                                                        const newEnd = lastMax + 10;
                                                        const newBracket = `${newStart}-${newEnd}`;

                                                        const newConfig = { ...manningConfig };
                                                        newConfig.brackets = [...newConfig.brackets, newBracket];
                                                        newConfig.rows = newConfig.rows.map((row: any) => ({
                                                            ...row,
                                                            counts: [...row.counts, 0]
                                                        }));
                                                        setManningConfig(newConfig);
                                                    }}
                                                    className={styles.addBracketBtn}
                                                >+ PAX</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manningConfig.rows.map((row: any, rowIdx: number) => (
                                            <tr key={rowIdx}>
                                                {/* Delete button (First column) */}
                                                <td className={styles.stickyTrash}>
                                                    <button
                                                        onClick={() => {
                                                            if (!confirm('Remove this role?')) return;
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.rows = newConfig.rows.filter((_: any, i: number) => i !== rowIdx);
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.removeRoleBtn}
                                                        title="Remove Row"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                                {/* Role dropdown */}
                                                <td className={styles.stickyCol}>
                                                    <select
                                                        value={row.role || ''}
                                                        onChange={e => {
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.rows = [...newConfig.rows];
                                                            newConfig.rows[rowIdx] = { ...newConfig.rows[rowIdx], role: e.target.value };
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.roleSelect}
                                                    >
                                                        <option value="">Select Role</option>
                                                        {roles.map(r => (
                                                            <option key={r.id} value={r.name}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {/* Skill dropdown */}
                                                <td className={styles.stickyColSkill}>
                                                    <select
                                                        value={row.skill || ''}
                                                        onChange={e => {
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.rows = [...newConfig.rows];
                                                            newConfig.rows[rowIdx] = { ...newConfig.rows[rowIdx], skill: e.target.value };
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.skillSelect}
                                                    >
                                                        <option value="">Select Skill</option>
                                                        {skills.map(s => (
                                                            <option key={s.id} value={s.name}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                {row.counts.map((count: number, colIdx: number) => (
                                                    <td key={colIdx}>
                                                        <div className={styles.stepperContainer}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={count}
                                                                onChange={e => {
                                                                    const newConfig = { ...manningConfig };
                                                                    newConfig.rows = [...newConfig.rows];
                                                                    newConfig.rows[rowIdx] = {
                                                                        ...newConfig.rows[rowIdx],
                                                                        counts: [...newConfig.rows[rowIdx].counts]
                                                                    };
                                                                    newConfig.rows[rowIdx].counts[colIdx] = parseInt(e.target.value) || 0;
                                                                    setManningConfig(newConfig);
                                                                }}
                                                                className={styles.stepperInput}
                                                            />
                                                            <div className={styles.stepperButtons}>
                                                                <button
                                                                    type="button"
                                                                    className={styles.stepperUp}
                                                                    onClick={() => {
                                                                        const newConfig = { ...manningConfig };
                                                                        newConfig.rows = [...newConfig.rows];
                                                                        newConfig.rows[rowIdx] = {
                                                                            ...newConfig.rows[rowIdx],
                                                                            counts: [...newConfig.rows[rowIdx].counts]
                                                                        };
                                                                        newConfig.rows[rowIdx].counts[colIdx] = (newConfig.rows[rowIdx].counts[colIdx] || 0) + 1;
                                                                        setManningConfig(newConfig);
                                                                    }}
                                                                >
                                                                    <ChevronUp size={12} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={styles.stepperDown}
                                                                    onClick={() => {
                                                                        const newConfig = { ...manningConfig };
                                                                        newConfig.rows = [...newConfig.rows];
                                                                        newConfig.rows[rowIdx] = {
                                                                            ...newConfig.rows[rowIdx],
                                                                            counts: [...newConfig.rows[rowIdx].counts]
                                                                        };
                                                                        newConfig.rows[rowIdx].counts[colIdx] = Math.max(0, (newConfig.rows[rowIdx].counts[colIdx] || 0) - 1);
                                                                        setManningConfig(newConfig);
                                                                    }}
                                                                >
                                                                    <ChevronDown size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ))}
                                                <td></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.gridActions}>
                                <button
                                    onClick={() => {
                                        const newConfig = { ...manningConfig };
                                        newConfig.rows = [...newConfig.rows, {
                                            role: '',
                                            skill: '',
                                            counts: new Array(newConfig.brackets.length).fill(0)
                                        }];
                                        setManningConfig(newConfig);
                                    }}
                                    className={styles.addBracketBtn}
                                    style={{ borderStyle: 'solid', padding: '0.6rem 1.25rem', marginTop: '1.5rem' }}
                                >+ Add Row</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
