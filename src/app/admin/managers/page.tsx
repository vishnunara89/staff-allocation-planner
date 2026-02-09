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
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Manage Managers</h2>
                    <p>Create and control manager access across all venues.</p>
                </div>
            </header>

            <div style={{
                background: 'white',
                padding: '4rem 2rem',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                textAlign: 'center',
                marginTop: '2rem'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#f1f5f9',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: '#64748b'
                }}>
                    <Shield size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Manager Management Module</h3>
                <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                    The ability to create and manage system users requires the <b>Authentication & Permissions Module (Phase 4)</b>.
                    This feature is currently under development to ensure enterprise-grade security for Nara's operations.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <span style={{ padding: '6px 16px', background: '#f8fafc', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' }}>Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
