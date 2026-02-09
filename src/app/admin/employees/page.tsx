"use client";

import { useState } from "react";
import {
    Users,
    Search,
    Filter,
    FileUp,
    FileDown,
    UserPlus,
    MapPin,
    CheckCircle2,
    X,
    Phone,
    MessageCircle,
    Star,
    MoreHorizontal
} from "lucide-react";
import styles from "./employees.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import AdminEmployeeCard from "@/components/AdminEmployeeCard";
import AdminImportModal from "@/components/AdminImportModal";

const dummyEmployees = [
    { id: 1, name: "Ahmed Khan", role: "Service", phone: "+971 50 123 4567", camp: "SONARA", status: "Available", type: "Full-time", languages: ["English", "Arabic"], vip: true },
    { id: 2, name: "Maria Garcia", role: "Bar", phone: "+971 52 987 6543", camp: "NEST", status: "Working", type: "Freelance", languages: ["English", "Spanish"], vip: false },
    { id: 3, name: "Chen Wei", role: "Service", phone: "+971 55 555 1234", camp: "SONARA", status: "On Leave", type: "Full-time", languages: ["English", "Mandarin"], vip: true },
    { id: 4, name: "Elena Petrova", role: "Hostess", phone: "+971 58 444 7777", camp: "LADY NARA", status: "Available", type: "Part-time", languages: ["English", "Russian"], vip: true },
];

export default function AdminEmployeesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
                        options={[{ id: 'service', name: 'Service' }, { id: 'bar', name: 'Bar' }, { id: 'kitchen', name: 'Kitchen' }]}
                        value=""
                        onChange={() => { }}
                        placeholder="All Roles"
                    />
                    <CustomDropdown
                        options={[{ id: 'sonara', name: 'SONARA' }, { id: 'nest', name: 'NEST' }, { id: 'ladynara', name: 'LADY NARA' }]}
                        value=""
                        onChange={() => { }}
                        placeholder="All Home Camps"
                    />
                    <CustomDropdown
                        options={[{ id: 'available', name: 'Available' }, { id: 'working', name: 'Working' }, { id: 'off', name: 'Off Duty' }]}
                        value=""
                        onChange={() => { }}
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
                        {dummyEmployees.map(emp => (
                            <tr key={emp.id}>
                                <td style={{ fontWeight: 600 }}>
                                    {emp.name} {emp.vip && <span className={styles.vipBadge}>VIP</span>}
                                </td>
                                <td>{emp.role}</td>
                                <td>{emp.camp}</td>
                                <td>{emp.phone}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: emp.status === 'Available' ? '#dcfce7' : emp.status === 'Working' ? '#dbeafe' : '#f1f5f9',
                                        color: emp.status === 'Available' ? '#166534' : emp.status === 'Working' ? '#1e40af' : '#475569'
                                    }}>
                                        {emp.status}
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
                        ))}
                    </tbody>
                </table>
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
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{selectedEmployee.name}</h3>
                                <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>{selectedEmployee.role} • {selectedEmployee.type}</p>
                            </div>
                        </div>
                        <div className={styles.profileBody}>
                            <AdminEmployeeCard employee={selectedEmployee} />

                            <div style={{ marginTop: '2.5rem' }} className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Home Camp</span>
                                    <span className={styles.infoValue}>{selectedEmployee.camp}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Languages</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        {selectedEmployee.languages.map((l: string) => (
                                            <span key={l} style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{l}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Experience</span>
                                    <span className={styles.infoValue}>{selectedEmployee.vip ? "VIP & Fine Dining Flagged" : "Standard"}</span>
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
            />
        </div>
    );
}
