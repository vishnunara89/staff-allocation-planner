"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Shield,
    ShieldOff,
    MoreVertical,
    CheckCircle2,
    XCircle,
    MapPin,
    UserPlus
} from "lucide-react";
import styles from "./managers.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import ManagerModal from "@/components/ManagerModal";

// Dummy data for managers
const initialManagers = [
    { id: 1, name: "Ryan Operational", email: "ryan@nara.com", status: "Active", venues: ["SONARA", "NEST"], createdDate: "2025-10-12" },
    { id: 2, name: "Sarah Events", email: "sarah@nara.com", status: "Active", venues: ["LADY NARA", "SONARA"], createdDate: "2025-11-05" },
    { id: 3, name: "John Logistics", email: "john@nara.com", status: "Disabled", venues: ["RAMADAN CAMP"], createdDate: "2025-12-01" },
];

const dummyVenues = [
    { id: 1, name: "SONARA" },
    { id: 2, name: "NEST" },
    { id: 3, name: "LADY NARA" },
    { id: 4, name: "RAMADAN CAMP" },
];

export default function ManagersPage() {
    const [managers, setManagers] = useState(initialManagers);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<any>(null);

    const toggleManagerStatus = (id: number) => {
        setManagers(managers.map(m => {
            if (m.id === id) {
                return { ...m, status: m.status === "Active" ? "Disabled" : "Active" };
            }
            return m;
        }));
    };

    const handleSaveManager = (data: any) => {
        if (editingManager) {
            setManagers(managers.map(m => m.id === editingManager.id ? { ...m, ...data } : m));
        } else {
            setManagers([...managers, { ...data, id: managers.length + 1, createdDate: new Date().toISOString().split('T')[0] }]);
        }
        setIsModalOpen(false);
    };

    const openAddModal = () => {
        setEditingManager(null);
        setIsModalOpen(true);
    };

    const openEditModal = (manager: any) => {
        setEditingManager(manager);
        setIsModalOpen(true);
    };

    const filteredManagers = managers.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "" || m.status.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Manage Managers</h2>
                    <p>Create and control manager access across all venues.</p>
                </div>
                <button className={styles.buttonPrimary} onClick={openAddModal}>
                    <UserPlus size={20} /> Add New Manager
                </button>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.searchInputWrapper}>
                    <span className={styles.searchIcon}>
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <CustomDropdown
                        options={[
                            { id: 'active', name: 'Active' },
                            { id: 'disabled', name: 'Disabled' }
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="All Statuses"
                        icon={<CheckCircle2 size={16} />}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Manager</th>
                            <th>Assigned Venues</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredManagers.map((manager) => (
                            <tr key={manager.id} className={manager.status === 'Disabled' ? styles.disabledRow : ''}>
                                <td>
                                    <div className={styles.managerInfo}>
                                        <span className={styles.managerName}>{manager.name}</span>
                                        <span className={styles.managerEmail}>{manager.email}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.venueTags}>
                                        {manager.venues.map(v => (
                                            <span key={v} className={styles.venueTag}>{v}</span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.statusGroup}>
                                        <label className={styles.toggleSwitch}>
                                            <input
                                                type="checkbox"
                                                checked={manager.status === 'Active'}
                                                onChange={() => toggleManagerStatus(manager.id)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                        <span className={`${styles.statusBadge} ${manager.status === 'Active' ? styles.statusActive : styles.statusDisabled}`}>
                                            {manager.status}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actionBtns}>
                                        <button className={styles.iconBtn} onClick={() => openEditModal(manager)} title="Edit Manager">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className={`${styles.iconBtn} ${styles.btnDelete}`} title="Delete Manager">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredManagers.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        <p>No managers found matching your criteria.</p>
                    </div>
                )}
            </div>

            <ManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveManager}
                editingManager={editingManager}
                allVenues={dummyVenues}
            />
        </div>
    );
}
