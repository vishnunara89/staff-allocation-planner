"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StaffMember, Venue, Role } from '@/types';
import styles from './staff.module.css';

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('');
    const [filterVenue, setFilterVenue] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/staff').then(r => r.json()),
            fetch('/api/venues').then(r => r.json()),
            fetch('/api/roles').then(r => r.json())
        ]).then(([staffData, venuesData, rolesData]) => {
            setStaff(staffData);
            setVenues(venuesData);
            setRoles(rolesData);
        }).catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getVenueName = (id?: number) => venues.find(v => v.id === id)?.name || '-';
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || '-';

    const filteredStaff = staff.filter(s => {
        if (filterRole && s.primary_role_id !== Number(filterRole)) return false;
        if (filterVenue && s.home_base_venue_id !== Number(filterVenue)) return false;
        return true;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Staff Roster</h2>
                <div className={styles.actions}>
                    <Link href="/staff/import" className={styles.buttonSecondary}>Import CSV</Link>
                    <Link href="/staff/new" className={styles.buttonPrimary}>+ Add Staff</Link>
                </div>
            </div>

            <div className={styles.filters}>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={filterVenue} onChange={e => setFilterVenue(e.target.value)}>
                    <option value="">All Home Bases</option>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Home Base</th>
                        <th>English</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredStaff.map(s => (
                        <tr key={s.id}>
                            <td>
                                <div className={styles.name}>{s.full_name}</div>
                                {Object.keys(s.other_languages || {}).length > 0 && (
                                    <div className={styles.subtext}>
                                        + {Object.keys(s.other_languages).join(', ')}
                                    </div>
                                )}
                            </td>
                            <td>{getRoleName(s.primary_role_id)}</td>
                            <td>{getVenueName(s.home_base_venue_id)}</td>
                            <td>{s.english_proficiency}</td>
                            <td>
                                <span className={`${styles.status} ${styles[s.availability_status]}`}>
                                    {s.availability_status}
                                </span>
                            </td>
                            <td>{s.employment_type}</td>
                            <td>
                                <Link href={`/staff/${s.id}/edit`}>Edit</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
