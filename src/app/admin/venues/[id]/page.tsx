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
    ChevronDown,
    Briefcase,
    Zap
} from "lucide-react";
import styles from "../venues.module.css";
import Link from "next/link";

interface VenueDetailProps {
    params: { id: string };
}

type TabType = 'Overview' | 'Staffing Rules';



export default function AdminVenueDetailPage({ params }: VenueDetailProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [venue, setVenue] = useState<any>(null);
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

    // Quick Add State
    const [newRole, setNewRole] = useState("");
    const [newSkill, setNewSkill] = useState("");
    const [showRoleManager, setShowRoleManager] = useState(false);
    const [showSkillManager, setShowSkillManager] = useState(false);

    const SKILL_OPTIONS = [
        'Table Service', 'Food Running', 'Mixology', 'Barista',
        'Hosting', 'Fine Dining', 'Buffet Service', 'Event Setup',
        'Wine Service', 'Guest Relations', 'Cash Handling', 'Inventory',
        'Team Lead', 'Training', 'VIP Service', 'Other'
    ];

    // Default PAX brackets (0-100 in steps of 10)
    const DEFAULT_BRACKETS = [
        '0-10', '10-20', '20-30', '30-40', '40-50',
        '50-60', '60-70', '70-80', '80-90', '90-100'
    ];

    // Manning Rules Excel Editor State
    const [manningTables, setManningTables] = useState<any[]>([]);
    const [manningConfig, setManningConfig] = useState<any>({ brackets: DEFAULT_BRACKETS, rows: [] });
    const [savingManning, setSavingManning] = useState(false);
    const [manningFeedback, setManningFeedback] = useState('');

    // Reason for change state
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [changeReason, setChangeReason] = useState("");

    useEffect(() => {
        async function fetchVenueData() {
            setLoading(true);
            try {
                const [venueRes, rulesRes, tablesRes, rolesRes, skillsRes] = await Promise.all([
                    fetch(`/api/venues/${params.id}`),
                    fetch(`/api/rules?venue_id=${params.id}`),
                    fetch(`/api/manning-tables?venue_id=${params.id}`),
                    fetch('/api/roles'),
                    fetch('/api/skills')
                ]);

                if (venueRes.ok) {
                    const vData = await venueRes.json();
                    setVenue(vData);
                    if (vData.name) {
                        document.title = `${vData.name} (Admin) | NARA Pulse`;
                    }
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

                if (rolesRes.ok) setRoles(await rolesRes.json());
                if (skillsRes.ok) setSkills(await skillsRes.json());

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

                // Fetch real activity log
                try {
                    const activityRes = await fetch(`/api/activity?venue_id=${params.id}`);
                    if (activityRes.ok) {
                        const activityData = await activityRes.json();
                        setActivityLog(Array.isArray(activityData) ? activityData : []);
                    }
                } catch (error) {
                    console.error('Failed to fetch activity log:', error);
                }
            } catch (error) {
                console.error("Failed to fetch venue details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchVenueData();
    }, [params.id]);

    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        try {
            const res = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRole.trim() })
            });
            if (res.ok) {
                const updated = await fetch("/api/roles").then(r => r.json());
                setRoles(updated);
                setNewRole("");
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteRole = async (id: number) => {
        if (!confirm("Are you sure you want to delete this role?")) return;
        try {
            // Assuming simplified DELETE logic matching the style
            const res = await fetch(`/api/roles?id=${id}`, { method: 'DELETE' });
            // For now, optimistically update UI as well
            setRoles(prev => prev.filter(r => r.id !== id));
        } catch (e) { console.error(e); }
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
                const updated = await fetch("/api/skills").then(r => r.json());
                setSkills(updated);
                setNewSkill("");
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteSkill = async (id: number) => {
        if (!confirm("Are you sure you want to delete this skill?")) return;
        try {
            const res = await fetch(`/api/skills?id=${id}`, { method: 'DELETE' });
            setSkills(prev => prev.filter(s => s.id !== id));
        } catch (e) { console.error(e); }
    };

    const handleFinalSave = async () => {
        setSavingManning(true);
        setManningFeedback('');
        try {
            const res = await fetch('/api/manning-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_id: Number(params.id),
                    department: 'all',
                    config: manningConfig,
                    changeReason: changeReason || "Updated staffing rules (Admin)"
                })
            });
            if (res.ok) {
                setManningFeedback('Staffing rules updated!');
                setShowReasonModal(false);
                setChangeReason("");
                setTimeout(() => setManningFeedback(''), 3000);

                // Refresh activity log
                const activityRes = await fetch(`/api/activity?venue_id=${params.id}`);
                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setActivityLog(Array.isArray(activityData) ? activityData : []);
                }
            } else {
                setManningFeedback('Failed to save');
            }
        } catch (err) {
            setManningFeedback('Failed to sync');
        } finally {
            setSavingManning(false);
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
            <div className={styles.breadcrumb}>
                <Link href="/admin/venues" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowLeft size={16} /> Venues / Camps
                </Link>
                <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{venue.name}</span>
            </div>

            <div className={styles.detailHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flex: '1 1 300px' }}>
                        <div className={styles.venueIcon}>
                            <MapPin size={32} />
                        </div>
                        {!editingVenue ? (
                            <div className={styles.venueTitleContainer}>
                                <span className={styles.venueType} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{venue.type}</span>
                                <h1 className={styles.venueDetailTitle}>{venue.name}</h1>
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
                            <div className={styles.overviewGrid}>
                                {/* LEFT COLUMN */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    <section>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Venue Information</h4>
                                        <p style={{ color: '#64748b', lineHeight: 1.6 }}>{venue.notes || "No operational notes provided for this venue."}</p>
                                    </section>

                                    <div className={styles.statsGrid}>
                                        {[
                                            { label: 'Rules Active', value: manningConfig.rows.length > 0 ? 'Yes' : 'No', icon: Settings },
                                            { label: 'Upcoming Events', value: '—', icon: Calendar },
                                            { label: 'Saved Tables', value: manningTables.length, icon: Database },
                                        ].map((stat, i) => (
                                            <div key={i} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                                <stat.icon size={24} style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }} />
                                                <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stat.value}</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>{stat.label}</div>
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
                                                                    <th className={styles.stickyCol} style={{ background: '#f8fafc' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            <Briefcase size={16} /> ROLE
                                                                        </div>
                                                                    </th>
                                                                    <th className={styles.stickyCol} style={{ left: '160px', width: '150px', background: '#f8fafc', fontSize: '0.8rem' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                            <Zap size={16} /> SKILL
                                                                        </div>
                                                                    </th>
                                                                    {table.config.brackets?.map((bracket: string, i: number) => (
                                                                        <th key={i} style={{ minWidth: '80px' }}>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                                                <Users size={14} style={{ opacity: 0.6 }} />
                                                                                <span style={{ fontSize: '0.8rem' }}>{bracket} PAX</span>
                                                                            </div>
                                                                        </th>
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
                                            <Shield size={20} /> Assigned Managers
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
                                                        <div className={styles.managerName} style={{ fontSize: '1.1rem' }}>{mgr.name}</div>
                                                        <div className={styles.managerPhone} style={{ fontSize: '0.9rem' }}>{mgr.phone || 'No phone'}</div>
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
                                            <Clock size={20} /> Recent Activity
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
                                                                <strong>{entry.user_name}</strong>
                                                                <span className={styles.activityTime}>
                                                                    {new Date(entry.created_at).toLocaleString([], {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className={styles.activityAction}>
                                                                {entry.action_type === 'STAFFING_UPDATE' ? 'Staffing Update' : entry.action_type}
                                                            </div>
                                                            <div className={styles.activityReason}>
                                                                <em>Reason:</em> "{entry.description}"
                                                            </div>
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
                            <div className={styles.quickAddContainer}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={18} style={{ color: 'var(--primary-color)' }} /> Quick Add Role
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Shield size={22} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
                                            <input
                                                value={newRole}
                                                onChange={(e) => setNewRole(e.target.value)}
                                                placeholder="Enter role name..."
                                                style={{
                                                    padding: "0 12px 0 42px",
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #e2e8f0',
                                                    width: '100%',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    background: 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddRole}
                                            style={{
                                                height: '40px',
                                                padding: '0 .25rem',
                                                borderRadius: '10px',
                                                marginLeft: '50px',
                                                background: 'var(--primary-color)', color: 'white',
                                                border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '0.4rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(124, 76, 44, 0.2)',
                                                transition: 'all 0.2s',
                                                fontWeight: 600,
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            title="Save Role to Database"
                                        >
                                            <Save size={16} strokeWidth={2.5} />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setShowRoleManager(!showRoleManager)}
                                            style={{
                                                width: '40px', height: '40px',
                                                padding: '0 .25rem',
                                                borderRadius: '10px',
                                                marginLeft: '-10px',
                                                background: 'white', color: '#64748b',
                                                border: '1.5px solid #e2e8f0',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            title="Select Roles for Deleting"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>

                                        {showRoleManager && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, marginTop: '12px',
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
                                                padding: '1rem', minWidth: '240px', maxHeight: '350px', overflowY: 'auto'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Database Roles</span>
                                                    <button onClick={() => setShowRoleManager(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {roles.map(r => (
                                                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>{r.name}</span>
                                                            <button
                                                                onClick={() => handleDeleteRole(r.id)}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4, transition: 'all 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Database size={18} style={{ color: 'var(--primary-color)' }} /> Quick Add Skill
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Zap size={22} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
                                            <input
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                placeholder="Enter skill name..."
                                                style={{
                                                    padding: "0 12px 0 42px",
                                                    height: '40px',
                                                    borderRadius: '10px',
                                                    border: '1.5px solid #e2e8f0',
                                                    width: '100%',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    background: 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddSkill}
                                            style={{
                                                height: '40px',
                                                padding: '0 .25rem',
                                                borderRadius: '10px',
                                                marginLeft: '50px',
                                                background: 'var(--primary-color)', color: 'white',
                                                border: 'none',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '0.4rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(124, 76, 44, 0.2)',
                                                transition: 'all 0.2s',
                                                fontWeight: 600,
                                                fontSize: '0.9rem'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                            title="Save Skill to Database"
                                        >
                                            <Save size={16} strokeWidth={2.5} />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setShowSkillManager(!showSkillManager)}
                                            style={{
                                                width: '40px', height: '40px',
                                                padding: '0 .25rem',
                                                borderRadius: '10px',
                                                marginLeft: '-10px',
                                                background: 'white', color: '#64748b',
                                                border: '1.5px solid #e2e8f0',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                            title="Select Skills for Deleting"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>

                                        {showSkillManager && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, marginTop: '12px',
                                                background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
                                                padding: '1rem', minWidth: '240px', maxHeight: '350px', overflowY: 'auto'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Database Skills</span>
                                                    <button onClick={() => setShowSkillManager(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    {skills.map(s => (
                                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>{s.name}</span>
                                                            <button
                                                                onClick={() => handleDeleteSkill(s.id)}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.4, transition: 'all 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem', alignItems: 'center', gap: '1.5rem' }}>
                                {manningFeedback && (
                                    <span className={styles.feedback} style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Check size={18} /> {manningFeedback}
                                    </span>
                                )}
                                <button
                                    onClick={() => setShowReasonModal(true)}
                                    style={{
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        height: '52px',
                                        padding: '0 2.5rem',
                                        borderRadius: '14px',
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
                                        boxShadow: '0 8px 20px rgba(124, 76, 44, 0.25)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(124, 76, 44, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 76, 44, 0.25)';
                                    }}
                                    disabled={savingManning}
                                >
                                    {savingManning ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                    {savingManning ? 'Syncing...' : 'Save Staffing Rules'}
                                </button>
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
                                                        {SKILL_OPTIONS.map(skill => (
                                                            <option key={skill} value={skill}>{skill}</option>
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
            {/* Reason for Change Modal */}
            {showReasonModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Reason for Change</h3>
                        <p>Please provide a brief reason for updating the staffing rules. This will be logged for audit purposes.</p>

                        <textarea
                            className={styles.modalTextarea}
                            placeholder="e.g., Seasonal adjustment, expected event, etc."
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            autoFocus
                        />

                        <div className={styles.modalActions}>
                            <button
                                className={styles.secondaryBtn}
                                onClick={() => {
                                    setShowReasonModal(false);
                                    setChangeReason("");
                                }}
                                disabled={savingManning}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.primaryBtnLarge}
                                onClick={handleFinalSave}
                                disabled={savingManning || !changeReason.trim()}
                            >
                                {savingManning ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
