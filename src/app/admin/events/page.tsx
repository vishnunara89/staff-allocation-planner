"use client";

import { useState } from "react";
import {
    Calendar,
    Search,
    Filter,
    ChevronRight,
    MapPin,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle2,
    Plus
} from "lucide-react";
import styles from "./events.module.css";
import Link from "next/link";

const dummyEvents = [
    { id: "e1", title: "Luxury Desert Wedding", venue: "SONARA", date: "Feb 15, 2026", time: "18:00", pax: 150, status: "Critical Gaps", gapCount: 12, type: "Wedding" },
    { id: "e2", title: "Corporate Sunset Retreat", venue: "NEST", date: "Feb 16, 2026", time: "17:00", pax: 45, status: "Minor Gaps", gapCount: 2, type: "Corporate" },
    { id: "e3", title: "Valentine's Special", venue: "LADY NARA", date: "Feb 14, 2026", time: "19:00", pax: 80, status: "Fully Staffed", gapCount: 0, type: "Standard" },
    { id: "e4", title: "Desert Festival", venue: "SONARA", date: "Feb 20, 2026", time: "16:00", pax: 400, status: "Unplanned", gapCount: 45, type: "Event" },
];

export default function AdminEventsPage() {
    const [viewMode, setViewMode] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Global Events</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Monitor staffing health across all Nara venues.</p>
                </div>
                <button style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <Plus size={18} /> New Event
                </button>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.filters}>
                    {(['Upcoming', 'Past', 'All'] as const).map(mode => (
                        <div
                            key={mode}
                            className={`${styles.filter} ${viewMode === mode ? styles.activeFilter : ''}`}
                            onClick={() => setViewMode(mode)}
                        >
                            {mode}
                        </div>
                    ))}
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search events..."
                        style={{ width: '100%', height: '44px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            <div className={styles.eventGrid}>
                {dummyEvents.map(event => (
                    <Link href={`/admin/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
                        <div className={styles.eventCard}>
                            <div className={styles.cardHeader}>
                                <span className={styles.venueTag}>{event.venue}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>{event.type}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <h3 className={styles.eventTitle}>{event.title}</h3>
                                <div className={styles.infoRow}>
                                    <Calendar size={16} /> <span>{event.date}</span>
                                    <Clock size={16} style={{ marginLeft: '1rem' }} /> <span>{event.time}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <Users size={16} /> <span>{event.pax} Guests</span>
                                </div>

                                <div className={`${styles.gapStatus} ${event.gapCount > 10 ? styles.gapCritical :
                                        event.gapCount > 0 ? styles.gapWarning :
                                            styles.gapSuccess
                                    }`}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                                        {event.gapCount > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                        {event.status}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                        {event.gapCount > 0 ? `${event.gapCount} roles need assignment` : 'Staffing requirements met'}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>View Staffing Plan</span>
                                <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
