"use client";

import {
    Users,
    MapPin,
    Calendar,
    AlertTriangle,
    Plus,
    ArrowRight,
    Search,
    Clock,
    UserPlus,
    PlusSquare
} from "lucide-react";
import styles from "./admin-dashboard.module.css";
import Link from "next/link";

const metrics = [
    { label: "Total Venues", value: "12", icon: MapPin, color: "#7C4C2C", bg: "#fdf5f0" },
    { label: "Active Managers", value: "8", icon: Users, color: "#1e40af", bg: "#eff6ff" },
    { label: "Total Employees", value: "142", icon: UserPlus, color: "#15803d", bg: "#f0fdf4" },
    { label: "Today's Events", value: "3", icon: Calendar, color: "#92400e", bg: "#fffbeb" },
    { label: "Staffing Gaps", value: "5", icon: AlertTriangle, color: "#b91c1c", bg: "#fef2f2" },
];

const activities = [
    { user: "Ryan", action: "generated a plan for SONARA", time: "2 hours ago", type: "plan" },
    { user: "Vishnu", action: "added 12 employees via bulk import", time: "5 hours ago", type: "import" },
    { user: "Sarah", action: "updated manning rules for NEST", time: "Yesterday", type: "rule" },
    { user: "Ryan", action: "created a new event: Corporate Dinner", time: "Yesterday", type: "event" },
    { user: "Admin", action: "assigned Vishnu to Lady Nara", time: "2 days ago", type: "assignment" },
];

export default function AdminDashboard() {
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h1>System Overview</h1>
                    <p className={styles.subtitle}>Welcome back, System Administrator</p>
                </div>
            </header>

            <section className={styles.metricsGrid}>
                {metrics.map((metric, i) => (
                    <div key={i} className={styles.metricCard}>
                        <div className={styles.metricHeader}>
                            <div
                                className={styles.metricIcon}
                                style={{ backgroundColor: metric.bg, color: metric.color }}
                            >
                                <metric.icon size={20} />
                            </div>
                            <span className={`${styles.metricTrend} ${i % 2 === 0 ? styles.trendUp : styles.trendDown}`}>
                                {i % 2 === 0 ? "+12%" : "-2%"}
                            </span>
                        </div>
                        <div>
                            <div className={styles.metricValue}>{metric.value}</div>
                            <div className={styles.metricLabel}>{metric.label}</div>
                        </div>
                    </div>
                ))}
            </section>

            <div className={styles.sectionGrid}>
                <section className={styles.quickActions}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                    <div className={styles.actionGrid}>
                        <button className={styles.actionBtn}>
                            <PlusSquare size={24} />
                            <span>Add New Manager</span>
                        </button>
                        <button className={styles.actionBtn}>
                            <Plus size={24} />
                            <span>Add New Venue</span>
                        </button>
                        <button className={styles.actionBtn}>
                            <Calendar size={24} />
                            <span>View Today's Events</span>
                        </button>
                        <button className={styles.actionBtn}>
                            <AlertTriangle size={24} />
                            <span>Check Staffing Gaps</span>
                        </button>
                    </div>
                </section>

                <section className={styles.activityFeed}>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                    <div className={styles.activityList}>
                        {activities.map((item, i) => (
                            <Link href="/admin/activity" key={i} className={styles.activityItem}>
                                <div className={styles.activityIcon}>
                                    <Clock size={16} />
                                </div>
                                <div className={styles.activityInfo}>
                                    <p className={styles.activityText}>
                                        <strong>{item.user}</strong> {item.action}
                                    </p>
                                    <span className={styles.activityTime}>{item.time}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <Link href="/admin/activity" className={styles.viewAllBtn} style={{ fontSize: '0.85rem', color: '#7C4C2C', fontWeight: 600, textAlign: 'center', marginTop: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        View All Activity <ArrowRight size={14} />
                    </Link>
                </section>
            </div>
        </div>
    );
}
