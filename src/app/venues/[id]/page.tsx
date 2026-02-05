"use client";

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Venue, StaffingRule, Role } from '@/types';
import styles from './venue-detail.module.css';

export default function VenueDetailPage({ params }: { params: { id: string } }) {
    const [venue, setVenue] = useState<Venue | null>(null);
    const [rules, setRules] = useState<StaffingRule[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showAddRule, setShowAddRule] = useState(false);
    const [newRule, setNewRule] = useState<Partial<StaffingRule>>({
        department: 'service',
        ratio_guests: 10,
        ratio_staff: 1
    });

    useEffect(() => {
        Promise.all([
            fetch(`/api/venues/${params.id}`).then(r => r.json()),
            fetch(`/api/rules?venue_id=${params.id}`).then(r => r.json()),
            fetch('/api/roles').then(r => r.json())
        ]).then(([venueData, rulesData, rolesData]) => {
            if (venueData.error) throw new Error(venueData.error);
            setVenue(venueData);
            setRules(rulesData);
            setRoles(rolesData);
        }).catch(err => {
            setError('Failed to load venue data');
            console.error(err);
        }).finally(() => setLoading(false));
    }, [params.id]);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Venue>>({});
    const router = useRouter(); // Need to import useRouter at top

    // ... existing rule state ...

    useEffect(() => {
        // ... existing loading logic ...
    }, [params.id]);

    async function handleUpdateVenue(e: FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch(`/api/venues/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            const updated = await res.json();
            if (updated.error) throw new Error(updated.error);
            setVenue({ ...venue, ...updated } as Venue);
            setIsEditing(false);
        } catch (err: any) {
            alert(err.message || 'Failed to update venue');
        }
    }

    async function handleDeleteVenue() {
        if (!confirm('Are you sure you want to delete this venue? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/venues/${params.id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete');
            }
            router.push('/venues');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        }
    }

    async function handleAddRule(e: FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venue_id: Number(params.id),
                    ...newRule
                })
            });
            const savedRule = await res.json();
            if (savedRule.error) throw new Error(savedRule.error);

            setRules([...rules, savedRule]);
            setShowAddRule(false);
            setNewRule({ department: 'service', ratio_guests: 10, ratio_staff: 1 }); // reset
        } catch (err) {
            alert('Failed to save rule');
            console.error(err);
        }
    }

    async function handleDeleteRule(id: number) {
        if (!confirm('Delete this rule?')) return;
        try {
            await fetch(`/api/rules/${id}`, { method: 'DELETE' });
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    }

    function getRoleName(id: number) {
        if (!roles || roles.length === 0) return 'Loading...';
        const role = roles.find(r => r.id === id);
        return role ? role.name : `Unknown Role (${id})`;
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!venue) return <div>Venue not found</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                {isEditing ? (
                    <form onSubmit={handleUpdateVenue} className={styles.editForm}>
                        <div className={styles.formGroup}>
                            <label>Name</label>
                            <input
                                value={editForm.name || ''}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Type</label>
                            <select
                                value={editForm.type}
                                onChange={e => setEditForm({ ...editForm, type: e.target.value as any })}
                            >
                                <option value="camp">Camp</option>
                                <option value="private">Private</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Service Style</label>
                            <select
                                value={editForm.default_service_style}
                                onChange={e => setEditForm({ ...editForm, default_service_style: e.target.value as any })}
                            >
                                <option value="sharing">Sharing</option>
                                <option value="buffet">Buffet</option>
                                <option value="plated">Plated</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Notes</label>
                            <textarea
                                value={editForm.notes || ''}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            />
                        </div>
                        <div className={styles.actions}>
                            <button type="submit" className={styles.buttonPrimary}>Save Changes</button>
                            <button type="button" onClick={() => setIsEditing(false)} className={styles.buttonSecondary}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    <div>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{venue.name}</h1>
                            <div className={styles.actions}>
                                <button onClick={() => {
                                    setEditForm(venue);
                                    setIsEditing(true);
                                }} className={styles.buttonSecondary}>Edit Venue</button>
                                <button onClick={handleDeleteVenue} className={styles.buttonDanger}>Delete Venue</button>
                            </div>
                        </div>
                        <div className={styles.meta}>
                            {venue.type} • {venue.default_service_style}
                        </div>
                        {venue.notes && <p className={styles.notes}>{venue.notes}</p>}
                    </div>
                )}
            </header>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>Staffing Rules</h2>
                    <button onClick={() => setShowAddRule(!showAddRule)} className={styles.button}>
                        {showAddRule ? 'Cancel' : '+ Add Rule'}
                    </button>
                </div>

                {showAddRule && (
                    <form onSubmit={handleAddRule} className={styles.form}>
                        {/* New Rule Form */}
                        <div className={styles.formGroup}>
                            <label>Department</label>
                            <select
                                value={newRule.department}
                                onChange={e => setNewRule({ ...newRule, department: e.target.value as any })}
                            >
                                <option value="service">Service</option>
                                <option value="bar">Bar</option>
                                <option value="management">Management</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Role</label>
                            <select
                                required
                                value={newRule.role_id || ''}
                                onChange={e => setNewRule({ ...newRule, role_id: Number(e.target.value) })}
                            >
                                <option value="">Select Role...</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Ratio (Guests/Staff)</label>
                                <input
                                    type="number"
                                    value={newRule.ratio_guests}
                                    onChange={e => setNewRule({ ...newRule, ratio_guests: Number(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Min Required</label>
                                <input
                                    type="number"
                                    value={newRule.min_required || ''}
                                    onChange={e => setNewRule({ ...newRule, min_required: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <button type="submit" className={styles.submitButton}>Save Rule</button>
                    </form>
                )}

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Dept</th>
                            <th>Role</th>
                            <th>Rule</th>
                            <th>Constraints</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(rule => (
                            <tr key={rule.id}>
                                <td>{rule.department}</td>
                                <td>{getRoleName(rule.role_id)}</td>
                                <td>
                                    1 per {rule.ratio_guests} guests
                                    {rule.threshold_guests && ` (Threshold: ${rule.threshold_guests})`}
                                </td>
                                <td>
                                    {rule.min_required ? `Min: ${rule.min_required}` : '-'}
                                </td>
                                <td>
                                    <button onClick={() => handleDeleteRule(rule.id)} className={styles.deleteButton}>×</button>
                                </td>
                            </tr>
                        ))}
                        {rules.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center' }}>No rules defined yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
