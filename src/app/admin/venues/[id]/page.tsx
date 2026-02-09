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
    RotateCcw
} from "lucide-react";
import styles from "../venues.module.css";
import Link from "next/link";
import { MANNING_TEMPLATES } from "@/lib/manningTemplates";

interface VenueDetailProps {
    params: { id: string };
}

type TabType = 'Overview' | 'Staffing Rules' | 'Manning Tables';

export default function AdminVenueDetailPage({ params }: VenueDetailProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Overview');
    const [venue, setVenue] = useState<any>(null);
    const [rules, setRules] = useState<any[]>([]);
    const [manningTables, setManningTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Manning Rules Excel Editor State
    const [selectedTemplate, setSelectedTemplate] = useState<string>('Custom');
    const [manningDept, setManningDept] = useState<string>('all');
    const [manningConfig, setManningConfig] = useState<any>({ brackets: ['0-50'], rows: [] });
    const [savingManning, setSavingManning] = useState(false);
    const [manningFeedback, setManningFeedback] = useState('');
    const [availableDepts, setAvailableDepts] = useState<string[]>(['all']);

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

                    // Pre-load first available table into editor
                    if (Array.isArray(tData) && tData.length > 0) {
                        setManningConfig(tData[0].config);
                        setManningDept(tData[0].department);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch venue details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchVenueData();
    }, [params.id]);

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
            <Link href="/admin/venues" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Venues
            </Link>

            <div className={styles.detailHeader}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(124, 76, 44, 0.1)', color: 'var(--primary-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} />
                        </div>
                        <div>
                            <span className={styles.venueType} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{venue.type}</span>
                            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, margin: 0 }}>{venue.name}</h1>
                        </div>
                    </div>
                </div>

                <nav className={styles.tabs}>
                    {(['Overview', 'Staffing Rules', 'Manning Tables'] as TabType[]).map((tab) => (
                        <div
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </div>
                    ))}
                </nav>

                <div className={styles.tabContent}>
                    {activeTab === 'Overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <section>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Venue Information</h4>
                                    <p style={{ color: '#64748b', lineHeight: 1.6 }}>{venue.notes || "No operational notes provided for this venue."}</p>
                                </section>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                    {[
                                        { label: 'Active Rules', value: rules.length, icon: Settings },
                                        { label: 'Upcoming Events', value: '—', icon: Calendar },
                                        { label: 'Manning Tables', value: manningTables.length, icon: Database },
                                    ].map((stat, i) => (
                                        <div key={i} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                            <stat.icon size={20} style={{ color: 'var(--primary-color)', marginBottom: '0.75rem' }} />
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Shield size={18} /> Assigned Managers
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                            Manager assignment available in Phase 4.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Staffing Rules' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Staffing Rules ({rules.length})</h3>
                                <Link href="/admin/rules" className={styles.viewAllBtn} style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                                    Manage All Rules
                                </Link>
                            </div>
                            {rules.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                                    <Settings size={32} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                                    <p>No special staffing rules defined for this venue.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {rules.map((rule: any) => (
                                        <div key={rule.id} style={{ padding: '1rem', background: 'white', border: '1px solid #f1f5f9', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase' }}>{rule.department}</span>
                                                <div style={{ fontWeight: 600 }}>Role ID: {rule.role_id}</div>
                                            </div>
                                            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
                                                {rule.ratio_guests && <div>{rule.ratio_staff}:{rule.ratio_guests} PAX</div>}
                                                {rule.min_required > 0 && <div>Min: {rule.min_required}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Manning Tables' && (
                        <div className={styles.manningEditor}>
                            <div className={styles.manningHeader}>
                                <div className={styles.templateSelector}>
                                    <label>Template:</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={e => setSelectedTemplate(e.target.value)}
                                        className={styles.select}
                                    >
                                        {MANNING_TEMPLATES.map(t => (
                                            <option key={t.name} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            const template = MANNING_TEMPLATES.find(t => t.name === selectedTemplate);
                                            if (!template) return;
                                            setAvailableDepts(template.departments);
                                            const firstDept = template.departments[0];
                                            setManningDept(firstDept);
                                            setManningConfig(template.configs[firstDept]);
                                        }}
                                        className={styles.addBracketBtn}
                                        style={{ borderStyle: 'solid', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <RotateCcw size={14} /> Load Template
                                    </button>
                                </div>
                                <div className={styles.manningActions}>
                                    {manningFeedback && <span className={styles.feedback}>{manningFeedback}</span>}
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
                                                        department: manningDept,
                                                        config: manningConfig
                                                    })
                                                });
                                                if (res.ok) {
                                                    setManningFeedback('Operational rules updated!');
                                                    setTimeout(() => setManningFeedback(''), 3000);
                                                }
                                            } catch (err) {
                                                setManningFeedback('Failed to sync');
                                            } finally {
                                                setSavingManning(false);
                                            }
                                        }}
                                        className={styles.viewAllBtn}
                                        style={{ background: 'var(--primary-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        disabled={savingManning}
                                    >
                                        <Save size={16} /> {savingManning ? 'Syncing...' : 'Save Manning Rules'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.deptTabs}>
                                {['service', 'bar', 'management'].map(dept => (
                                    <button
                                        key={dept}
                                        className={`${styles.deptTab} ${manningDept === dept ? styles.activeDeptTab : ''}`}
                                        onClick={() => setManningDept(dept)}
                                    >
                                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.excelGridContainer}>
                                <table className={styles.excelGrid}>
                                    <thead>
                                        <tr>
                                            <th className={styles.stickyCol}>Role</th>
                                            {manningConfig.brackets.map((bracket: string, idx: number) => (
                                                <th key={idx} className={styles.bracketHeader}>
                                                    <input
                                                        type="text"
                                                        value={bracket}
                                                        onChange={e => {
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.brackets = [...newConfig.brackets];
                                                            newConfig.brackets[idx] = e.target.value;
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.bracketInput}
                                                    />
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
                                                    >×</button>
                                                </th>
                                            ))}
                                            <th style={{ background: 'white' }}>
                                                <button
                                                    onClick={() => {
                                                        const lastBracket = manningConfig.brackets[manningConfig.brackets.length - 1] || '0-50';
                                                        const parts = lastBracket.split('-');
                                                        const lastMax = parseInt(parts[1]) || 50;
                                                        const newBracket = `${lastMax}-${lastMax + 50}`;
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
                                                <td className={styles.stickyCol}>
                                                    <input
                                                        type="text"
                                                        value={row.role}
                                                        onChange={e => {
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.rows = [...newConfig.rows];
                                                            newConfig.rows[rowIdx] = { ...newConfig.rows[rowIdx], role: e.target.value };
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.roleInput}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (!confirm('Remove this role?')) return;
                                                            const newConfig = { ...manningConfig };
                                                            newConfig.rows = newConfig.rows.filter((_: any, i: number) => i !== rowIdx);
                                                            setManningConfig(newConfig);
                                                        }}
                                                        className={styles.removeRoleBtn}
                                                    >×</button>
                                                </td>
                                                {row.counts.map((count: number, colIdx: number) => (
                                                    <td key={colIdx}>
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
                                                            className={styles.countInput}
                                                        />
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
                                            role: 'New Role',
                                            counts: new Array(newConfig.brackets.length).fill(0)
                                        }];
                                        setManningConfig(newConfig);
                                    }}
                                    className={styles.addBracketBtn}
                                    style={{ borderStyle: 'solid', padding: '0.6rem 1.25rem' }}
                                >+ Add Row</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
