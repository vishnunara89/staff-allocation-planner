"use client";

import {
    FileText,
    Download,
    Filter,
    Search,
    ChevronRight,
    Users
} from "lucide-react";
import styles from "./plans.module.css";
import CustomDropdown from "@/components/CustomDropdown";

const dummyPlans = [
    {
        id: "p1",
        event: "Luxury Desert Wedding",
        venue: "SONARA",
        date: "Feb 15, 2026",
        totalStaff: 28,
        roles: { Manager: 2, Waiter: 18, Bar: 6, Hostess: 2 },
        status: "Finalized"
    },
    {
        id: "p2",
        event: "Corporate Sunset Retreat",
        venue: "NEST",
        date: "Feb 16, 2026",
        totalStaff: 12,
        roles: { Manager: 1, Waiter: 8, Bar: 2, Hostess: 1 },
        status: "Draft"
    },
    {
        id: "p3",
        event: "Valentine's Special",
        venue: "LADY NARA",
        date: "Feb 14, 2026",
        totalStaff: 15,
        roles: { Manager: 1, Waiter: 10, Bar: 3, Hostess: 1 },
        status: "Finalized"
    }
];

export default function AdminPlansPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Staffing Plans</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Overview of all finalized and draft staffing plans.</p>
                </div>
                <button style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <Download size={18} /> Export All (CSV)
                </button>
            </header>

            <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <CustomDropdown options={[]} value="" onChange={() => { }} placeholder="All Venues" />
                    <CustomDropdown options={[]} value="" onChange={() => { }} placeholder="Finalized Only" />
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search plans by event..."
                        style={{ width: '100%', height: '44px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.plansTableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>EVENT / VENUE</th>
                            <th>DATE</th>
                            <th>TOTAL STAFF</th>
                            <th>ROLE BREAKDOWN</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dummyPlans.map(plan => (
                            <tr key={plan.id}>
                                <td>
                                    <div style={{ fontWeight: 700 }}>{plan.event}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 800 }}>{plan.venue}</div>
                                </td>
                                <td>{plan.date}</td>
                                <td style={{ fontWeight: 700 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Users size={16} style={{ color: '#94a3b8' }} /> {plan.totalStaff}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.roleBreakdown}>
                                        {Object.entries(plan.roles).map(([role, count]) => (
                                            <div key={role} className={styles.rolePill}>
                                                {role} <span className={styles.roleCount}>{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        background: plan.status === 'Finalized' ? '#dcfce7' : '#f1f5f9',
                                        color: plan.status === 'Finalized' ? '#166534' : '#475569'
                                    }}>
                                        {plan.status}
                                    </span>
                                </td>
                                <td>
                                    <button style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FileText size={14} /> View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
