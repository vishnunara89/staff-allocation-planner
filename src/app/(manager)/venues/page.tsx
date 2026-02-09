"use client";

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Venue } from '@/types';
import styles from './venues.module.css';

export default function VenuesPage() {
    const router = useRouter();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
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

    function openModal() {
        setFormData({ name: '', type: 'camp', default_service_style: 'sharing', notes: '' });
        setFormError('');
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
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

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create venue');
            }

            const newVenue = await res.json();
            setShowModal(false);
            router.push(`/venues/${newVenue.id}`);
            router.refresh();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setSubmitting(false);
        }
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
                    <button onClick={openModal} className={styles.primaryButton}>+ Add Venue</button>
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

            {/* Add Venue Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Add New Venue</h2>
                            <button className={styles.closeButton} onClick={closeModal}>×</button>
                        </div>

                        {formError && <div className={styles.modalError}>{formError}</div>}

                        <form onSubmit={handleSubmit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Venue Name <span className={styles.required}>*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Sonara Camp Dubai"
                                    className={styles.modalInput}
                                    autoFocus
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Venue Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className={styles.modalSelect}
                                    >
                                        <option value="camp">Camp</option>
                                        <option value="private">Private</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Service Style</label>
                                    <select
                                        value={formData.default_service_style}
                                        onChange={e => setFormData({ ...formData, default_service_style: e.target.value })}
                                        className={styles.modalSelect}
                                    >
                                        <option value="sharing">Sharing</option>
                                        <option value="buffet">Buffet</option>
                                        <option value="plated">Plated</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Notes</label>
                                <textarea
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Optional notes about this venue..."
                                    className={styles.modalTextarea}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={closeModal} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitButton} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Venue'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
