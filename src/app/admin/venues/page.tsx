"use client";

import { useState } from "react";
import {
    MapPin,
    Users,
    Settings,
    Calendar,
    Plus,
    ArrowRight,
    Search,
    ChevronRight,
    MoreVertical
} from "lucide-react";
import styles from "./venues.module.css";
import Link from "next/link";

const dummyVenues = [
    { id: 1, name: "SONARA", type: "LUXURY CAMP", managers: 2, rules: 14, notes: "Flagship luxury desert dining experience.", color: "#7C4C2C" },
    { id: 2, name: "NEST", type: "CAMP", managers: 1, rules: 8, notes: "Eco-friendly glamping and stargazing.", color: "#1e40af" },
    { id: 3, name: "LADY NARA", type: "RESTAURANT", managers: 2, rules: 12, notes: "Premium restaurant in the desert.", color: "#b91c1c" },
    { id: 4, name: "RAMADAN CAMP", type: "SEASONAL", managers: 1, rules: 20, notes: "Special seasonal operations camp.", color: "#15803d" },
];

export default function AdminVenuesPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredVenues = dummyVenues.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Venues & Camps</h2>
                    <p>Global management of all physical locations and operational rules.</p>
                </div>
                <button
                    style={{ background: 'var(--primary-color)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Add New Venue
                </button>
            </header>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', height: '48px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.venueGrid}>
                {filteredVenues.map((venue) => (
                    <Link href={`/admin/venues/${venue.id}`} key={venue.id} style={{ textDecoration: 'none' }}>
                        <div className={styles.venueCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.venueTitle}>
                                    <span className={styles.venueType}>{venue.type}</span>
                                    <h3>{venue.name}</h3>
                                </div>
                                <button className={styles.moreBtn} style={{ background: 'none', border: 'none', color: '#94a3b8' }}>
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <p className={styles.venueNotes}>{venue.notes}</p>

                            <div className={styles.cardMetrics}>
                                <div className={styles.metric}>
                                    <div className={styles.metricValue}>
                                        <Users size={16} /> {venue.managers}
                                    </div>
                                    <span className={styles.metricLabel}>Managers</span>
                                </div>
                                <div className={styles.metric}>
                                    <div className={styles.metricValue}>
                                        <Settings size={16} /> {venue.rules}
                                    </div>
                                    <span className={styles.metricLabel}>Rules</span>
                                </div>
                            </div>

                            <div className={styles.venueFooter}>
                                <div className={styles.managerAvatars}>
                                    {[...Array(venue.managers)].map((_, i) => (
                                        <div key={i} className={styles.avatar}>M</div>
                                    ))}
                                </div>
                                <div className={styles.viewDetail}>
                                    Manage <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
