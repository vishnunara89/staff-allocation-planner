"use client";

import { useState, useEffect } from "react";
import {
    Search,
    FileUp,
    FileDown,
    UserPlus,
    X,
    Loader2
} from "lucide-react";
import styles from "./employees.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import AdminEmployeeCard from "@/components/AdminEmployeeCard";
import AdminImportModal from "@/components/AdminImportModal";
import EmployeeModal from "@/components/EmployeeModal";
import { StaffMember, Venue, Role } from "@/types";
import { extractPhone } from "@/lib/staff-utils";

export default function AdminEmployeesPage() {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Filters
    const [filterRole, setFilterRole] = useState("");
    const [filterVenue, setFilterVenue] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [staffData, venuesData, rolesData] = await Promise.all([
                fetch('/api/staff').then(r => r.ok ? r.json() : []).catch(() => []),
                fetch('/api/venues').then(r => r.ok ? r.json() : []).catch(() => []),
                fetch('/api/roles').then(r => r.ok ? r.json() : []).catch(() => [])
            ]);

            // Safety check: ensure arrays
            setStaff(Array.isArray(staffData) ? staffData : []);
            setVenues(Array.isArray(venuesData) ? venuesData : []);
            setRoles(Array.isArray(rolesData) ? rolesData : []);
        } catch (err) {
            console.error('Failed to fetch admin employee data:', err);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id?: number | null) => {
        if (!id) return '-';
        return venues.find(v => v.id === id)?.name || '-';
    };
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || '-';

    const filteredEmployees = staff.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
            (extractPhone(s.notes) || '').includes(searchQuery);
        const matchesRole = !filterRole || s.primary_role_id === Number(filterRole);
        const matchesVenue = !filterVenue || s.home_base_venue_id === Number(filterVenue);
        const matchesStatus = !filterStatus || s.availability_status === filterStatus;
        return matchesSearch && matchesRole && matchesVenue && matchesStatus;
    });

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Employee Registry</h2>
                    <p>Global workforce data across all operational sites.</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.buttonSecondary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                        <FileDown size={18} /> Export
                    </button>
                    <button
                        className={styles.buttonSecondary}
                        onClick={() => setIsImportModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                        <FileUp size={18} /> Bulk Import
                    </button>
                    <button
                        className={styles.buttonPrimary}
                        onClick={() => setIsAddModalOpen(true)}
                        style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)' }}
                    >
                        <UserPlus size={18} /> Add Employee
                    </button>
                </div>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.filterGrid}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or role..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                height: '48px',
                                padding: '0 1rem 0 3rem',
                                border: '1.5px solid #e2e8f0',
                                borderRadius: '12px',
                                background: '#f8fafc',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <CustomDropdown
                        options={roles}
                        value={filterRole}
                        onChange={setFilterRole}
                        placeholder="All Roles"
                    />
                    <CustomDropdown
                        options={venues}
                        value={filterVenue}
                        onChange={setFilterVenue}
                        placeholder="All Home Bases"
                    />
                    <CustomDropdown
                        options={[
                            { id: 'available', name: 'Available' },
                            { id: 'off', name: 'Off' },
                            { id: 'leave', name: 'Leave' }
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="All Statuses"
                    />
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Camp</th>
                            <th>Phone</th>
                            <th style={{ textAlign: 'center' }}>Contact</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const phone = extractPhone(emp.notes);
                            return (
                                <tr key={emp.id}>
                                    <td>
                                        <div className={styles.staffNameWrapper}>
                                            <div className={styles.staffAvatar}>
                                                {emp.full_name.charAt(0)}
                                            </div>
                                            <div className={styles.staffMeta}>
                                                <div className={styles.staffName}>{emp.full_name}</div>
                                                <div className={styles.tagCloud}>
                                                    {emp.english_proficiency && (
                                                        <span className={`${styles.tag} ${styles.tagLanguage}`}>
                                                            EN: {emp.english_proficiency}
                                                        </span>
                                                    )}
                                                    {Object.entries(emp.other_languages || {}).map(([lang, level]) => (
                                                        <span key={lang} className={`${styles.tag} ${styles.tagLanguage}`}>
                                                            {lang}: {level as string}
                                                        </span>
                                                    ))}
                                                    {(emp.special_skills as string[] || []).map(skill => (
                                                        <span key={skill} className={`${styles.tag} ${styles.tagSkill}`}>
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getRoleName(emp.primary_role_id)}</td>
                                    <td>{getVenueName(emp.home_base_venue_id)}</td>
                                    <td>{phone || '-'}</td>
                                    <td>
                                        <div className={styles.contactCell} style={{ justifyContent: 'center' }}>
                                            <a
                                                href={phone ? `tel:${phone}` : '#'}
                                                className={`${styles.iconButton} ${!phone ? styles.disabled : ''}`}
                                                title={phone || "No phone provided"}
                                                onClick={e => !phone && e.preventDefault()}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                                </svg>
                                            </a>
                                            <a
                                                href={phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`${styles.iconButton} ${styles.whatsapp} ${!phone ? styles.disabled : ''}`}
                                                title={phone || "No phone provided"}
                                                onClick={e => !phone && e.preventDefault()}
                                            >
                                                <svg viewBox="0 0 448 512" fill="currentColor">
                                                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.6-30.6-38.2-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: emp.availability_status === 'available' ? '#dcfce7' : emp.availability_status === 'leave' ? '#fff7ed' : '#f1f5f9',
                                            color: emp.availability_status === 'available' ? '#166534' : emp.availability_status === 'leave' ? '#9a3412' : '#475569',
                                            textTransform: 'capitalize'
                                        }}>
                                            {emp.availability_status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedEmployee(emp)}
                                            style={{ background: 'none', border: '1.5px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
                                        >
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredEmployees.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No employees found matching your criteria.</div>
                )}
            </div>

            {selectedEmployee && (
                <>
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100 }} onClick={() => setSelectedEmployee(null)} />
                    <div className={styles.profileSlideOut}>
                        <div className={styles.profileHeader}>
                            <button className={styles.closeBtn} onClick={() => setSelectedEmployee(null)}>
                                <X size={18} />
                            </button>
                            <div style={{ marginTop: '1rem' }}>
                                <span className={styles.infoLabel} style={{ marginBottom: '0.5rem', display: 'block' }}>Employee Profile</span>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{selectedEmployee.full_name}</h3>
                                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>{getRoleName(selectedEmployee.primary_role_id)} • {selectedEmployee.employment_type}</p>
                            </div>
                        </div>
                        <div className={styles.profileBody}>
                            <AdminEmployeeCard employee={{
                                id: selectedEmployee.id,
                                name: selectedEmployee.full_name,
                                role: getRoleName(selectedEmployee.primary_role_id),
                                phone: extractPhone(selectedEmployee.notes) || '',
                                status: selectedEmployee.availability_status
                            }} />

                            <div style={{ marginTop: '2.5rem' }}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Home Base</span>
                                    <span className={styles.infoValue}>{getVenueName(selectedEmployee.home_base_venue_id)}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Languages</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>English: {selectedEmployee.english_proficiency}</span>
                                        {Object.entries(selectedEmployee.other_languages || {}).map(([lang, level]) => (
                                            <span key={lang} style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{lang}: {level as string}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Special Skills</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                        {(selectedEmployee.special_skills as string[] || []).map(skill => (
                                            <span key={skill} style={{ padding: '2px 8px', background: '#f0f9ff', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: '#0369a1' }}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <AdminImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchData}
            />

            <EmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
                venues={venues}
                roles={roles}
            />
        </div>
    );
}
