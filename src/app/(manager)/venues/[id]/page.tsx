"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Venue, Role } from '@/types';
import { MANNING_TEMPLATES } from '@/lib/manningTemplates';
import styles from './venue-detail.module.css';
import {
    MapPin,
    ArrowLeft,
    Loader2,
    Settings,
    Calendar,
    Database,
    Shield
} from "lucide-react";
import Link from "next/link";

interface ManningConfig {
    brackets: string[];
    rows: { role: string; counts: number[] }[];
}

export default function VenueDetailPage({ params }: { params: { id: string } }) {
    const [venue, setVenue] = useState<Venue | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [activeTab, setActiveTab] = useState<'Overview' | 'Staffing Rules'>('Overview');

    // Manning Rules State
    const [manningDept, setManningDept] = useState<string>('all');
    const [manningConfig, setManningConfig] = useState<ManningConfig>({ brackets: ['0-50'], rows: [] });

    useEffect(() => {
        Promise.all([
            fetch(`/api/venues/${params.id}`).then(r => r.json()),
            fetch(`/api/roles`).then(r => r.json()),
            fetch(`/api/manning-tables?venue_id=${params.id}`).then(r => r.json())
        ]).then(([venueData, rolesData, tablesData]) => {
            if (venueData.error) throw new Error(venueData.error);
            setVenue(venueData);
            setRoles(rolesData);

            if (venueData.name) {
                document.title = `${venueData.name} | NARA Intelligence`;
            }

            if (Array.isArray(tablesData) && tablesData.length > 0) {
                setManningConfig(tablesData[0].config);
                setManningDept(tablesData[0].department);
            }
        }).catch(err => {
            setError('Failed to load venue data');
            console.error(err);
        }).finally(() => setLoading(false));
    }, [params.id]);

    function handleDeptChange(dept: string) {
        setManningDept(dept);
        // In read-only mode, we just fetch or switch local state if multiple depts are loaded
        // For now, assume it switches based on the saved data if available
        fetch(`/api/manning-tables?venue_id=${params.id}&department=${dept}`)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setManningConfig(data[0].config);
                } else {
                    // fall back to template or empty
                    const template = MANNING_TEMPLATES[0]; // Default SONARA
                    if (template && template.configs[dept]) {
                        setManningConfig(template.configs[dept]);
                    } else {
                        setManningConfig({ brackets: ['0-50'], rows: [] });
                    }
                }
            });
    }

    if (loading) {
        return (
            <div style={{ padding: '8rem', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={48} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3>Loading venue data...</h3>
            </div>
        );
    }

    if (error || !venue) {
        return (
            <div style={{ padding: '8rem', textAlign: 'center' }}>
                <h3 style={{ color: '#e11d48' }}>{error || 'Venue Not Found'}</h3>
                <Link href="/venues" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Return to Venues</Link>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.stickyHeader}>
                <div className={styles.headerTop}>
                    <Link href="/venues" className={styles.backLink} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={16} /> Back to Venues
                    </Link>
                </div>

                <div className={styles.headerTitleRow}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'rgba(124, 76, 44, 0.1)', color: 'var(--primary-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={32} />
                        </div>
                        <div>
                            <span className={styles.badge} style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{venue.type}</span>
                            <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, margin: 0 }}>{venue.name}</h1>
                        </div>
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
            </header>

            <div className={styles.content}>
                {activeTab === 'Overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px', padding: '1.5rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Shield size={18} /> Support
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                                    Staffing requirements are managed by the System Administrator. Please contact them for requests.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Staffing Rules' && (
                    <div className={styles.manningEditor}>
                        <div className={styles.manningHeader}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-cormorant), serif' }}>Staffing Rules</h3>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Authorized View Only</span>
                        </div>

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
                                                No rules defined for {manningDept} in this venue.
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
        </div>
    );
}
