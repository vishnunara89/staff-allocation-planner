"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { Venue } from '@/types';
import styles from './venues.module.css';

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // ShowModal and form state removed for read-only mode

    useEffect(() => {
        fetchVenues();
    }, []);

    async function fetchVenues() {
        try {
            const res = await fetch('/api/venues', { cache: 'no-store' });
            if (!res.ok) throw new Error();
            setVenues(await res.json());
        } catch {
            setError('Error loading venues');
        } finally {
            setLoading(false);
        }
    }

    // Read-only: handleSubmit removed

    const filteredVenues = venues.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Venues</h2>
            </div>

            <input
                placeholder="Search venues..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={styles.searchInput}
            />

            {loading ? <p>Loading…</p> : (
                <div className={styles.grid}>
                    {filteredVenues.map(v => (
                        <Link key={v.id} href={`/venues/${v.id}`} className={styles.card}>
                            <h3>{v.name}</h3>
                            <span>{v.type}</span>
                            <p>{v.default_service_style}</p>
                        </Link>
                    ))}
                </div>
            )}

// Modal removed for read-only mode
        </div>
    );
}
