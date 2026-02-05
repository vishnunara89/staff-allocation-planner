"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../staff.module.css';
import { Venue, Role } from '@/types';

export default function NewStaffPage() {
    const router = useRouter();
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState({
        full_name: '',
        primary_role_id: '',
        home_base_venue_id: '',
        employment_type: 'full_time', // Updated default per user request
        english_proficiency: 'fluent',
        availability_status: 'available',
        other_languages: '', // Comma separated for UI
        special_skills: '' // Comma separated for UI
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/venues').then(r => r.json()),
            fetch('/api/roles').then(r => r.json())
        ]).then(([venuesData, rolesData]) => {
            setVenues(venuesData);
            setRoles(rolesData);
        }).catch(err => console.error(err));
    }, []);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            // Process languages and skills
            const languagesObj = formData.other_languages.split(',').reduce((acc, lang) => {
                const trimmed = lang.trim();
                if (trimmed) acc[trimmed] = 'fluent'; // Defaulting to fluent, can be enhanced later
                return acc;
            }, {} as Record<string, string>);

            const skillsArr = formData.special_skills.split(',').map(s => s.trim()).filter(Boolean);

            const payload = {
                ...formData,
                primary_role_id: Number(formData.primary_role_id),
                home_base_venue_id: formData.home_base_venue_id ? Number(formData.home_base_venue_id) : undefined,
                other_languages: languagesObj,
                special_skills: skillsArr
            };

            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create staff member');
            }

            router.push('/staff');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Add New Staff Member</h2>
                <Link href="/staff" className={styles.buttonSecondary}>Cancel</Link>
            </div>

            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form} style={{ maxWidth: '800px' }}>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Primary Role *</label>
                        <select
                            required
                            value={formData.primary_role_id}
                            onChange={e => setFormData({ ...formData, primary_role_id: e.target.value })}
                        >
                            <option value="">Select Role...</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Home Base Venue</label>
                        <select
                            value={formData.home_base_venue_id}
                            onChange={e => setFormData({ ...formData, home_base_venue_id: e.target.value })}
                        >
                            <option value="">No Home Base</option>
                            {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Employment Type</label>
                        <select
                            value={formData.employment_type}
                            onChange={e => setFormData({ ...formData, employment_type: e.target.value })}
                        >
                            <option value="full_time">Full Time</option>
                            <option value="part_time">Part Time</option>
                            <option value="freelance">Freelance</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>English Proficiency</label>
                        <select
                            value={formData.english_proficiency}
                            onChange={e => setFormData({ ...formData, english_proficiency: e.target.value })}
                        >
                            <option value="fluent">Fluent</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="basic">Basic</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select
                            value={formData.availability_status}
                            onChange={e => setFormData({ ...formData, availability_status: e.target.value })}
                        >
                            <option value="available">Available</option>
                            <option value="booked">Booked</option>
                            <option value="unavailable">Unavailable</option>
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Other Languages (comma separated, e.g. "Russian, French")</label>
                    <input
                        type="text"
                        value={formData.other_languages}
                        onChange={e => setFormData({ ...formData, other_languages: e.target.value })}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Special Skills (comma separated, e.g. "Sommelier, First Aid")</label>
                    <input
                        type="text"
                        value={formData.special_skills}
                        onChange={e => setFormData({ ...formData, special_skills: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    className={styles.buttonPrimary}
                    disabled={submitting}
                >
                    {submitting ? 'Creating...' : 'Create Staff Member'}
                </button>
            </form>
        </div>
    );
}
