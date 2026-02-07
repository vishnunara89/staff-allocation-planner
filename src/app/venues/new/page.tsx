"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../venues.module.css';

export default function NewVenuePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        type: 'camp',
        default_service_style: 'sharing',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create venue');
            }

            const newVenue = await res.json();
            router.push(`/venues/${newVenue.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Add New Venue</h2>
                <Link href="/venues" className={styles.buttonSecondary}>Cancel</Link>
            </div>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form} style={{ maxWidth: '600px' }}>
                <div className={styles.formGroup}>
                    <label>Venue Name *</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sonara Camp"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Type</label>
                    <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="camp">Camp</option>
                        <option value="private">Private</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Default Service Style</label>
                    <select
                        value={formData.default_service_style}
                        onChange={e => setFormData({ ...formData, default_service_style: e.target.value })}
                    >
                        <option value="sharing">Sharing</option>
                        <option value="buffet">Buffet</option>
                        <option value="plated">Plated</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label>Notes</label>
                    <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    className={styles.buttonPrimary}
                    disabled={submitting}
                >
                    {submitting ? 'Creating...' : 'Create Venue'}
                </button>
            </form>
        </div>
    );
}
