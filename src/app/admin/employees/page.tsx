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
                fetch('/api/staff').then(r => r.json()),
                fetch('/api/venues').then(r => r.json()),
                fetch('/api/roles').then(r => r.json())
            ]);
            setStaff(staffData);
            setVenues(venuesData);
            setRoles(rolesData);
        } catch (err) {
            console.error('Failed to fetch admin employee data:', err);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id?: number) => venues.find(v => v.id === id)?.name || '-';
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || '-';

    const filteredEmployees = staff.filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
                    <button className={styles.buttonPrimary} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)' }}>
                        <UserPlus size={18} /> Add Employee
                    </button>
                </div>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.toolRow}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or role..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', height: '48px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none' }}
                        />
                    </div>
                </div>
                <div className={styles.filterGroup}>
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
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => {
                            const phone = extractPhone(emp.notes);
                            return (
                                <tr key={emp.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        {emp.full_name}
                                    </td>
                                    <td>{getRoleName(emp.primary_role_id)}</td>
                                    <td>{getVenueName(emp.home_base_venue_id)}</td>
                                    <td>{phone || '-'}</td>
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
                                    <td>
                                        <button
                                            onClick={() => setSelectedEmployee(emp)}
                                            style={{ background: 'none', border: '1.5px solid #e2e8f0', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', cursor: 'pointer' }}
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

                            <button style={{ width: '100%', marginTop: '3rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '1rem', borderRadius: '12px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                                Edit Full Profile
                            </button>
                        </div>
                    </div>
                </>
            )}

            <AdminImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
}
