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

const activityLogs = [
    { id: 1, time: "2m ago", user: "Admin", action: "modified manning rules for", target: "SONARA", type: "settings", icon: Settings, color: "#94a3b8" },
    { id: 2, time: "15m ago", user: "Sarah Events", action: "finalized staffing plan for", target: "Luxury Desert Wedding", type: "event", icon: Calendar, color: "var(--primary-color)" },
    { id: 3, time: "1h ago", user: "Admin", action: "disabled manager account", target: "John Doe", type: "user", icon: User, color: "#ef4444" },
    { id: 4, time: "3h ago", user: "Ryan Op", action: "assigned 5 waiters to", target: "Corporate Retreat", type: "event", icon: ArrowUpRight, color: "#22c55e" },
    { id: 5, time: "Yesterday", user: "Admin", action: "updated venue notes for", target: "NEST Desert Nest", type: "venue", icon: MapPin, color: "#3b82f6" },
];

export default function AdminActivityPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Activity Log</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Comprehensive audit trail of all system actions.</p>
                </div>
            </header>

            <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: '#64748b', cursor: 'pointer' }}>
                        <Filter size={18} /> Filter All
                    </div>
                </div>
                <div style={{ position: 'relative', width: '350px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search logs by user, action, or target..."
                        style={{ width: '100%', height: '44px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.logContainer}>
                {activityLogs.map(log => (
                    <div key={log.id} className={styles.logItem}>
                        <div className={styles.logTime}>{log.time}</div>
                        <div className={styles.logContent}>
                            <div className={styles.logIcon} style={{ background: `${log.color}15`, color: log.color }}>
                                <log.icon size={20} />
                            </div>
                            <div className={styles.logText}>
                                <b>{log.user}</b> {log.action} <b>{log.target}</b>
                            </div>
                        </div>
                        <div className={styles.logEntity}>
                            {log.type.toUpperCase()}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                    Load More Activity
                </button>
            </div>
        </div>
    );
}
