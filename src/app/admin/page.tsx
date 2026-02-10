"use client";

import { useEffect, useState } from "react";
import {
    Users,
    MapPin,
    Calendar,
    AlertTriangle,
    Plus,
    ArrowRight,
    Clock,
    UserPlus,
    PlusSquare
} from "lucide-react";
import styles from "./admin-dashboard.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();
    const [counts, setCounts] = useState({
        venues: 0,
        staff: 0,
        events: 0,
        gaps: 0,
        managers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const today = new Date().toISOString().split('T')[0];

                // Fetch data in parallel
                const [venuesRes, staffRes, eventsRes, managersRes] = await Promise.all([
                    fetch('/api/venues'),
                    fetch('/api/staff'),
                    fetch(`/api/events?from_date=${today}`),
                    fetch('/api/managers')
                ]);

                const [venuesData, staffData, eventsData, managersData] = await Promise.all([
                    venuesRes.json().catch(() => ({ value: [] })),
                    staffRes.json().catch(() => ({ value: [] })),
                    eventsRes.json().catch(() => ({ value: [] })),
                    managersRes.json().catch(() => ({ value: [] }))
                ]);

                const venues = Array.isArray(venuesData) ? venuesData : [];
                const staff = Array.isArray(staffData) ? staffData : [];
                const events = Array.isArray(eventsData) ? eventsData : [];
                const managers = Array.isArray(managersData) ? managersData : [];

                setCounts({
                    venues: venues.length,
                    staff: staff.length,
                    events: events.length,
                    gaps: 0, // Placeholder for gaps
                    managers: managers.length
                });
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const metrics = [
        { label: "Total Venues", value: counts.venues, icon: MapPin, color: "#7C4C2C", bg: "#fdf5f0" },
        { label: "Active Managers", value: counts.managers || "—", icon: Users, color: "#1e40af", bg: "#eff6ff" },
        { label: "Total Employees", value: counts.staff, icon: UserPlus, color: "#15803d", bg: "#f0fdf4" },
        { label: "Today's Events", value: counts.events, icon: Calendar, color: "#92400e", bg: "#fffbeb" },
        { label: "Staffing Gaps", value: counts.gaps, icon: AlertTriangle, color: "#b91c1c", bg: "#fef2f2" },
    ];

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
                        </div>
                        <div>
                            <div className={styles.metricValue}>{loading ? "..." : metric.value}</div>
                            <div className={styles.metricLabel}>{metric.label}</div>
                        </div>
                    </div>
                ))}
            </section>

            <div className={styles.sectionGrid}>
                <section className={styles.quickActions}>
                    <h2 className={styles.sectionTitle}>Quick Actions</h2>
                    <div className={styles.actionGrid}>
                        <button className={styles.actionBtn} onClick={() => router.push('/admin/managers')}>
                            <PlusSquare size={24} />
                            <span>Add New Manager</span>
                        </button>
                        <button className={styles.actionBtn} onClick={() => router.push('/admin/venues')}>
                            <Plus size={24} />
                            <span>Add New Venue</span>
                        </button>
                        <button className={styles.actionBtn} onClick={() => router.push('/admin/events')}>
                            <Calendar size={24} />
                            <span>View Today's Events</span>
                        </button>
                        <button className={styles.actionBtn} onClick={() => router.push('/admin/plans')}>
                            <AlertTriangle size={24} />
                            <span>Check Staffing Gaps</span>
                        </button>
                    </div>
                </section>

                <section className={styles.activityFeed}>
                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                    <div className={styles.activityList}>
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            <Clock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                                Activity logging will be enabled in the next update.
                            </p>
                        </div>
                    </div>
                    <Link href="/admin/activity" className={styles.viewAllBtn} style={{ fontSize: '0.85rem', color: '#7C4C2C', fontWeight: 600, textAlign: 'center', marginTop: '1rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        View All Activity <ArrowRight size={14} />
                    </Link>
                </section>
            </div>
        </div>
    );
}
