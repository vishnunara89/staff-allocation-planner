"use client";

import {
    Activity,
    User,
    MapPin,
    Settings,
    Calendar,
    Search,
    Filter,
    ArrowUpRight
} from "lucide-react";
import styles from "../plans/plans.module.css";

export default function AdminActivityPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Activity Log</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Comprehensive audit trail of all system actions.</p>
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
                    <Activity size={32} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Audit System & Logs</h3>
                <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
                    Live tracking and historical audit logs are scheduled for the <b>Advanced Analytics & Audit Phase (Phase 5)</b>.
                    This will include detailed logs for every staffing change, room modification, and system update.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <span style={{ padding: '6px 16px', background: '#f8fafc', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' }}>Coming Soon</span>
                </div>
            </div>
        </div>
    );
}
