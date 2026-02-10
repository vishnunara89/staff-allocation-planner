"use client";

import { useEffect, useState } from 'react';
import Link from 'next/navigation';
import {
    Users,
    Settings,
    ArrowRight,
    Search,
    Building2,
    Loader2,
    MapPin
} from "lucide-react";
import styles from './venues.module.css';

interface Venue {
    id: number;
    name: string;
    type: string;
    notes: string;
    default_service_style?: string;
}

interface Rule {
    id: number;
    venue_id: number;
}

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [ruleCounts, setRuleCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVenues();
    }, []);

    async function fetchVenues() {
        setLoading(true);
        try {
            const [venuesRes, rulesRes] = await Promise.all([
                fetch('/api/venues', { cache: 'no-store' }),
                fetch('/api/rules')
            ]);

            if (!venuesRes.ok) throw new Error('Failed to fetch venues');

            const venuesJson = await venuesRes.json().catch(() => []);
            const rulesJson = await rulesRes.json().catch(() => []);

            const venuesData = Array.isArray(venuesJson) ? venuesJson : [];
            const rulesData = Array.isArray(rulesJson) ? rulesJson : [];

            // Calculate rule counts per venue
            const counts: Record<number, number> = {};
            rulesData.forEach((rule: Rule) => {
                counts[rule.venue_id] = (counts[rule.venue_id] || 0) + 1;
            });

            setVenues(venuesData);
            setRuleCounts(counts);
        } catch (err) {
            console.error("Failed to fetch venues data:", err);
            setError('Error loading venues');
        } finally {
            setLoading(false);
        }
    }

    const filteredVenues = venues.filter(v =>
        v.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        v.type?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Venues & Camps</h2>
                    <p>Your assigned venues and operational rules.</p>
                </div>
            </header>

            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading assigned venues...</p>
                </div>
            ) : filteredVenues.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                    <Building2 size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3>No Venues Assigned</h3>
                    <p style={{ color: '#64748b' }}>Contact your System Administrator if you should have access to a venue.</p>
                </div>
            ) : (
                <div className={styles.venueGrid}>
                    {filteredVenues.map((venue) => (
                        <div key={venue.id} className={styles.venueItem}>
                            <a href={`/venues/${venue.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                <div className={styles.venueCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.venueTitle}>
                                            <span className={styles.venueType}>{venue.type}</span>
                                            <h3>{venue.name}</h3>
                                        </div>
                                    </div>

                                    <p className={styles.venueNotes}>{venue.notes || "No additional notes provided."}</p>

                                    <div className={styles.cardMetrics}>
                                        <div className={styles.metric}>
                                            <div className={styles.metricValue}>
                                                <Users size={16} /> —
                                            </div>
                                            <span className={styles.metricLabel}>Managers</span>
                                        </div>
                                        <div className={styles.metric}>
                                            <div className={styles.metricValue}>
                                                <Settings size={16} /> {ruleCounts[venue.id] || 0}
                                            </div>
                                            <span className={styles.metricLabel}>Rules</span>
                                        </div>
                                    </div>

                                    <div className={styles.venueFooter}>
                                        <div className={styles.viewDetail}>
                                            Manage <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

