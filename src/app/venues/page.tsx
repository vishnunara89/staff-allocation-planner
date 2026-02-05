"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Venue } from '@/types';
import styles from './venues.module.css';

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    // Simple automated creation for demo if empty
    async function createDefaultVenues() {
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Venues</h2>
                {venues.length === 0 && (
                    <button onClick={createDefaultVenues} className={styles.button}>Load Default Venues</button>
                )}
                <Link href="/venues/new" className={styles.button}>+ Add Venue</Link>
            </div>

            <div className={styles.grid}>
                {venues.map(venue => (
                    <Link href={`/venues/${venue.id}`} key={venue.id} className={styles.card}>
                        <h3>{venue.name}</h3>
                        <span className={styles.badge}>{venue.type}</span>
                        <p>Service: {venue.default_service_style}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
