"use client";

import { useState } from "react";
import {
    MapPin,
    Users,
    Settings,
    Calendar,
    ArrowLeft,
    Plus,
    FileText,
    Database,
    Shield
} from "lucide-react";
import styles from "../venues.module.css";
import Link from "next/link";

interface VenueDetailProps {
    params: { id: string };
}

type TabType = 'Overview' | 'Staffing Rules' | 'Manning Tables' | 'Events' | 'Assigned Managers';

export default function AdminVenueDetailPage({ params }: VenueDetailProps) {
    const [activeTab, setActiveTab] = useState<TabType>('Overview');

    // In a real app, fetch venue data based on params.id
    const venue = { id: params.id, name: "SONARA", type: "LUXURY CAMP", notes: "Flagship luxury desert dining experience." };

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
                    <button style={{ background: 'var(--primary-color)', color: 'white', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                        Edit Venue details
                    </button>
                </div>

                <nav className={styles.tabs}>
                    {(['Overview', 'Staffing Rules', 'Manning Tables', 'Events', 'Assigned Managers'] as TabType[]).map((tab) => (
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
                                    <p style={{ color: '#64748b', lineHeight: 1.6 }}>{venue.notes}</p>
                                </section>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                    {[
                                        { label: 'Active Rules', value: '14', icon: Settings },
                                        { label: 'Upcoming Events', value: '24', icon: Calendar },
                                        { label: 'Manning Brackets', value: '8', icon: Database },
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
                                        {['Ryan Operational', 'Sarah Events'].map(m => (
                                            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '10px', background: '#f8fafc' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{m[0]}</div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m}</span>
                                            </div>
                                        ))}
                                        <button style={{ marginTop: '0.5rem', background: 'none', border: '1.5px dashed #cbd5e1', borderRadius: '10px', padding: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                                            + Assign Manager
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Overview' && (
                        <div style={{ padding: '4rem', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1.5px dashed #e2e8f0', color: '#64748b' }}>
                            <Settings size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3>{activeTab} Management</h3>
                            <p>Interface for {activeTab.toLowerCase()} is coming in the next execution step.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
