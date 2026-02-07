"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Venue } from '@/types';
import styles from './venues.module.css';

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVenues();
    }, []);

    async function fetchVenues() {
        try {
            const res = await fetch('/api/venues');
            if (!res.ok) throw new Error('Failed to fetch venues');
            const data = await res.json();
            setVenues(data);
        } catch (err) {
            setError('Error loading venues');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function createDefaultVenues() {
        setLoading(true);
        const defaults = [
            { name: 'Sonara Camp', type: 'camp', default_service_style: 'sharing' },
            { name: 'Nara Main', type: 'camp', default_service_style: 'buffet' },
            { name: 'The Nest', type: 'private', default_service_style: 'plated' }
        ];

        for (const v of defaults) {
            await fetch('/api/venues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(v)
            });
        }
        fetchVenues();
    }

    const filteredVenues = venues.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Venues</h2>
                    <p>Manage your camp locations and staffing configurations.</p>
                </div>
                <div className={styles.actions}>
                    <input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        aria-label="Search venues"
                    />
                    <Link href="/venues/new" className={styles.primaryButton}>+ Add Venue</Link>
                </div>
            </div>

            {loading ? (
                <div className={styles.grid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`${styles.card} ${styles.skeleton}`}>
                            <div className={styles.skeletonTitle}></div>
                            <div className={styles.skeletonBadge}></div>
                            <div className={styles.skeletonText}></div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : filteredVenues.length === 0 ? (
                <div className={styles.emptyState}>
                    {venues.length === 0 ? (
                        <>
                            <h3>No venues found</h3>
                            <p>Get started by adding your first venue or loading defaults.</p>
                            <button onClick={createDefaultVenues} className={styles.secondaryButton}>Load Default Venues</button>
                        </>
                    ) : (
                        <p>No venues match "{searchQuery}"</p>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredVenues.map(venue => (
                        <Link href={`/venues/${venue.id}`} key={venue.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{venue.name}</h3>
                                <span className={styles.badge}>{venue.type}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <p>Service Style: <strong>{venue.default_service_style}</strong></p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
