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

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'camp',
        default_service_style: 'sharing',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!formData.name.trim()) {
            setFormError('Venue name is required');
            return;
        }

        setSubmitting(true);
        setFormError('');

        try {
            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            // ✅ ADD NEW VENUE TO LIST
            setVenues(prev => [...prev, data]);

            setShowModal(false);
            setFormData({
                name: '',
                type: 'camp',
                default_service_style: 'sharing',
                notes: ''
            });

        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    const filteredVenues = venues.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Venues</h2>
                <button onClick={() => setShowModal(true)} className={styles.primaryButton}>
                    + Add Venue
                </button>
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

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Add Venue</h3>

                        {formError && <p className={styles.modalError}>{formError}</p>}

                        <form onSubmit={handleSubmit}>
                            <input
                                placeholder="Venue name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <button disabled={submitting}>
                                {submitting ? 'Creating…' : 'Create Venue'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
