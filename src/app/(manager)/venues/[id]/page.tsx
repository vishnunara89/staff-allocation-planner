"use client";

import { useEffect, useState } from 'react';
import {
    MapPin,
    ArrowLeft,
    Loader2,
    Settings,
    Calendar,
    Database,
    Shield,
    ChevronRight,
    Search,
    Clock,
    Trash2,
    Check,
    X,
    Save,
    ChevronUp,
    ChevronDown,
    Plus
} from "lucide-react";
import Link from "next/link";
import styles from './venue-detail.module.css';

interface Venue {
    id: number;
    name: string;
    type: string;
    notes: string;
    default_service_style?: string;
}

interface ManningConfig {
    brackets: string[];
    rows: any[];
}

export default function VenueDetailPage({ params }: { params: { id: string } }) {
    const [venue, setVenue] = useState<Venue | null>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [manningTables, setManningTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Overview' | 'Staffing Rules'>('Overview');

    // Manning Editor State
    const [manningConfig, setManningConfig] = useState<ManningConfig>({
        brackets: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70', '70-80', '80-90', '90-100'],
        rows: []
    });
    const [savingManning, setSavingManning] = useState(false);
    const [manningFeedback, setManningFeedback] = useState('');

    // Reason Modal State
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [changeReason, setChangeReason] = useState('');


    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        fetchVenueData();
    }, [params.id]);

    async function fetchVenueData() {
        setLoading(true);
        try {
            const [venueRes, rolesRes, skillsRes, tablesRes, activityRes] = await Promise.all([
                fetch(`/api/venues/${params.id}`),
                fetch(`/api/roles`),
                fetch(`/api/skills`),
                fetch(`/api/manning-tables?venue_id=${params.id}`),
                fetch(`/api/activity?venue_id=${params.id}`)
            ]);

            if (venueRes.ok) {
                const venueData = await venueRes.json();
                setVenue(venueData);
                if (venueData.name) {
                    document.title = `${venueData.name} | NARA Intelligence`;
                }
            }

            if (rolesRes.ok) {
                setRoles(await rolesRes.json());
            }

            if (skillsRes.ok) {
                setSkills(await skillsRes.json());
            }

            if (tablesRes.ok) {
                const tablesData = await tablesRes.json();
                setManningTables(Array.isArray(tablesData) ? tablesData : []);

                if (Array.isArray(tablesData) && tablesData.length > 0) {
                    setManningConfig(tablesData[0].config);
                }
            }

            if (activityRes.ok) {
                setActivities(await activityRes.json());
            }
        } catch (err) {
            console.error("Failed to load venue data:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleSaveInitiated = () => {
        setShowReasonModal(true);
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
                    changeReason: changeReason // ✅ Sending the reason
                })
            });
            if (res.ok) {
                setManningFeedback('Staffing rules updated!');
                setShowReasonModal(false);
                setChangeReason('');
                // Refresh tables for the overview
                const tablesRes = await fetch(`/api/manning-tables?venue_id=${params.id}`);
                if (tablesRes.ok) setManningTables(await tablesRes.json());
                setTimeout(() => setManningFeedback(''), 3000);
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
                <h3>Loading venue data...</h3>
            </div>
        );
    }

    if (!venue) {
        return (
            <div style={{ padding: '8rem', textAlign: 'center' }}>
                <h3 style={{ color: '#e11d48' }}>Venue Not Found</h3>
                <Link href="/venues" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Return to Venues</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
                <Link href="/venues" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ArrowLeft size={16} /> Venues / Camps
                </Link>
                <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                <span style={{ color: '#1a1a1a', fontWeight: 700 }}>{venue.name}</span>
            </div>

            <div className={styles.detailHeader}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(124, 76, 44, 0.1)', color: 'var(--primary-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={32} />
                    </div>
                    <div>
                        <span className={styles.badge} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{venue.type}</span>
                        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, margin: 0 }}>{venue.name}</h1>
                    </div>
                </div>

                <div className={styles.tabs}>
                    {(['Overview', 'Staffing Rules'] as const).map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className={styles.content}>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                <section>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Venue Information</h4>
                                    <p style={{ color: '#64748b', lineHeight: 1.6 }}>{venue.notes || "No operational notes provided for this venue."}</p>
                                </section>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                    {[
                                        { label: 'Rules Active', value: manningConfig.rows.length > 0 ? 'Yes' : 'No', icon: Settings },
                                        { label: 'Upcoming Events', value: '—', icon: Calendar },
                                        { label: 'Service Style', value: venue.default_service_style || 'Nara Standard', icon: Database },
                                    ].map((stat, i) => (
                                        <div key={i} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                            <stat.icon size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }} />
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Saved Rules Display */}
                                <div className={styles.savedRulesSection}>
                                    <h4 className={styles.savedRulesTitle}>
                                        <Database size={18} /> Saved Staffing Rules
                                    </h4>
                                    {manningTables.length === 0 ? (
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                                            No staffing rules configured yet.
                                        </p>
                                    ) : (
                                        manningTables.map((table, idx) => (
                                            <div key={idx} style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'capitalize', marginBottom: '0.75rem' }}>
                                                    {table.department} Rules
                                                </div>
                                                <div className={styles.excelGridContainer}>
                                                    <table className={styles.savedRulesTable}>
                                                        <thead>
                                                            <tr>
                                                                <th style={{ background: '#f8fafc' }}>Role</th>
                                                                <th style={{ background: '#f8fafc' }}>Skill</th>
                                                                {table.config.brackets?.map((bracket: string, i: number) => (
                                                                    <th key={i}>{bracket} PAX</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {table.config.rows?.map((row: any, ri: number) => (
                                                                <tr key={ri}>
                                                                    <td>{row.role || '—'}</td>
                                                                    <td>{row.skill || '—'}</td>
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={18} style={{ color: 'var(--primary-color)' }} /> Recent Updates
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {activities.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                                No recent updates found.
                                            </p>
                                        ) : (
                                            activities.slice(0, 5).map((log, idx) => (
                                                <div key={idx} style={{
                                                    paddingBottom: '1rem',
                                                    borderBottom: idx === Math.min(activities.length, 5) - 1 ? 'none' : '1px solid #f1f5f9',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{log.user_name}</span>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                                            {new Date(log.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p style={{ color: '#64748b', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                                                        "{log.description}"
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shield size={18} /> Support
                                    </h4>
                                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                        For venue configuration changes or staffing requests, please contact your System Administrator.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Staffing Rules' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', alignItems: 'center', gap: '1rem' }}>
                                {manningFeedback && (
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                                        {manningFeedback}
                                    </span>
                                )}
                                <button
                                    onClick={handleSaveInitiated}
                                    className={styles.primaryBtn}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '48px', padding: '0 2rem' }}
                                    disabled={savingManning}
                                >
                                    {savingManning ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Staffing Rules
                                </button>
                            </div>

                            <div className={styles.excelGridContainer}>
                                <table className={styles.excelGrid}>
                                    <thead>
                                        <tr>
                                            <th className={styles.stickyTrash}></th>
                                            <th className={styles.stickyCol}>Role</th>
                                            <th className={styles.stickyColSkill}>Skill</th>
                                            {manningConfig.brackets.map((bracket, idx) => (
                                                <th key={idx}>
                                                    <span className={styles.bracketLabel}>{bracket}</span>
                                                    <button
                                                        onClick={() => {
                                                            if (!confirm('Remove PAX bracket?')) return;
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.brackets = newConfig.brackets.filter((_, i) => i !== idx);
                                                            newConfig.rows = newConfig.rows.map(row => ({
                                                                ...row,
                                                                counts: row.counts.filter((_: any, i: number) => i !== idx)
                                                            }));
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.removeBracketBtn}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </th>
                                            ))}
                                            <th style={{ background: 'white', minWidth: '100px' }}>
                                                <button
                                                    onClick={() => {
                                                        const lastBracket = manningConfig.brackets[manningConfig.brackets.length - 1] || '0-10';
                                                        const parts = lastBracket.split('-');
                                                        const lastMax = parts.length === 2 ? parseInt(parts[1]) : 0;
                                                        const newBracket = `${lastMax}-${lastMax + 10}`;
                                                        setManningConfig({
                                                            ...manningConfig,
                                                            brackets: [...manningConfig.brackets, newBracket],
                                                            rows: manningConfig.rows.map(row => ({
                                                                ...row,
                                                                counts: [...row.counts, 0]
                                                            }))
                                                        });
                                                    }}
                                                    className={styles.addBracketBtn}
                                                >+ PAX</button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manningConfig.rows.map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                                <td className={styles.stickyTrash}>
                                                    <button
                                                        onClick={() => {
                                                            if (!confirm('Remove this role?')) return;
                                                            setManningConfig({
                                                                ...manningConfig,
                                                                rows: manningConfig.rows.filter((_, i) => i !== rowIdx)
                                                            });
                                                        }}
                                                        className={styles.removeRoleBtn}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                                <td className={styles.stickyCol}>
                                                    <select
                                                        value={row.role || ''}
                                                        onChange={e => {
                                                            const newRows = [...manningConfig.rows];
                                                            newRows[rowIdx] = { ...newRows[rowIdx], role: e.target.value };
                                                            setManningConfig({ ...manningConfig, rows: newRows });
                                                        }}
                                                        className={styles.roleSelect}
                                                    >
                                                        <option value="">Select Role</option>
                                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                                    </select>
                                                </td>
                                                <td className={styles.stickyColSkill}>
                                                    <select
                                                        value={row.skill || ''}
                                                        onChange={e => {
                                                            const newRows = [...manningConfig.rows];
                                                            newRows[rowIdx] = { ...newRows[rowIdx], skill: e.target.value };
                                                            setManningConfig({ ...manningConfig, rows: newRows });
                                                        }}
                                                        className={styles.skillSelect}
                                                    >
                                                        <option value="">Select Skill</option>
                                                        {skills.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                    </select>
                                                </td>
                                                {row.counts.map((count: number, colIdx: number) => (
                                                    <td key={colIdx}>
                                                        <div className={styles.stepperContainer}>
                                                            <input
                                                                type="number"
                                                                value={count}
                                                                onChange={e => {
                                                                    const newRows = [...manningConfig.rows];
                                                                    const newCounts = [...newRows[rowIdx].counts];
                                                                    newCounts[colIdx] = parseInt(e.target.value) || 0;
                                                                    newRows[rowIdx] = { ...newRows[rowIdx], counts: newCounts };
                                                                    setManningConfig({ ...manningConfig, rows: newRows });
                                                                }}
                                                                className={styles.stepperInput}
                                                            />
                                                            <div className={styles.stepperButtons}>
                                                                <button
                                                                    onClick={() => {
                                                                        const newRows = [...manningConfig.rows];
                                                                        const newCounts = [...newRows[rowIdx].counts];
                                                                        newCounts[colIdx] += 1;
                                                                        newRows[rowIdx] = { ...newRows[rowIdx], counts: newCounts };
                                                                        setManningConfig({ ...manningConfig, rows: newRows });
                                                                    }}
                                                                    className={styles.stepperUp}
                                                                >
                                                                    <ChevronUp size={12} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const newRows = [...manningConfig.rows];
                                                                        const newCounts = [...newRows[rowIdx].counts];
                                                                        newCounts[colIdx] = Math.max(0, newCounts[colIdx] - 1);
                                                                        newRows[rowIdx] = { ...newRows[rowIdx], counts: newCounts };
                                                                        setManningConfig({ ...manningConfig, rows: newRows });
                                                                    }}
                                                                    className={styles.stepperDown}
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
                            <button
                                onClick={() => {
                                    setManningConfig({
                                        ...manningConfig,
                                        rows: [...manningConfig.rows, { role: '', skill: '', counts: new Array(manningConfig.brackets.length).fill(0) }]
                                    });
                                }}
                                className={styles.addBracketBtn}
                                style={{ marginTop: '1.5rem', borderStyle: 'solid' }}
                            >
                                <Plus size={18} /> Add Row
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Reason for Change Modal */}
            {showReasonModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>📝 Reason for Change</h3>
                        <p>Please explain why you're updating the staffing rules:</p>
                        <textarea
                            value={changeReason}
                            onChange={e => setChangeReason(e.target.value)}
                            placeholder="Describe your reasoning here..."
                            className={styles.modalTextarea}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => { setShowReasonModal(false); setChangeReason(''); }} className={styles.secondaryBtn}>Cancel</button>
                            <button
                                onClick={handleFinalSave}
                                className={styles.primaryBtn}
                                disabled={changeReason.length < 5 || savingManning}
                            >
                                {savingManning ? 'Saving...' : 'Submit & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

