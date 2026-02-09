"use client";

import { useState } from "react";
import {
    Settings,
    Search,
    Filter,
    FileUp,
    ArrowRight,
    MapPin,
    Layout
} from "lucide-react";
import styles from "../venues/venues.module.css";
import CustomDropdown from "@/components/CustomDropdown";

const dummyRules = [
    { id: 1, venue: "SONARA", dept: "Service", role: "Waiter", type: "Ratio", value: "1:15 PAX" },
    { id: 2, venue: "SONARA", dept: "Bar", role: "Bartender", type: "Min", value: "2" },
    { id: 3, venue: "NEST", dept: "Service", role: "Waiter", type: "Ratio", value: "1:20 PAX" },
    { id: 4, venue: "LADY NARA", dept: "Service", role: "Waiter", type: "Threshold", value: ">20 PAX: +1" },
];

export default function GlobalRulesPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Manning Rules</h2>
                    <p>Global configuration for automated staffing logic.</p>
                </div>
                <button className={styles.buttonSecondary} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                    <FileUp size={18} /> Import Excel
                </button>
            </header>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search rules..."
                            style={{ width: '100%', height: '48px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <CustomDropdown options={[]} value="" onChange={() => { }} placeholder="All Venues" />
                    <CustomDropdown options={[]} value="" onChange={() => { }} placeholder="All Departments" />
                    <CustomDropdown options={[]} value="" onChange={() => { }} placeholder="All Roles" />
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>VENUE</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>DEPARTMENT</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ROLE</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>RULE TYPE</th>
                            <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>VALUE/CONFIG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyRules.map(rule => (
                            <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{rule.venue}</td>
                                <td style={{ padding: '1.25rem 1.5rem' }}>{rule.dept}</td>
                                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>{rule.role}</td>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{rule.type}</span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>{rule.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
