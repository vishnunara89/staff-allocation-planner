"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    Search,
    ChevronRight,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Loader2
} from "lucide-react";
import styles from "./events.module.css";
import Link from "next/link";
import EventModal from "@/components/EventModal";
import { Event, Venue, CreateEventDTO } from "@/types";

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'Upcoming' | 'Past' | 'All'>('Upcoming');
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    async function fetchData() {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let url = '/api/events';

            if (viewMode === 'Upcoming') {
                url += `?from_date=${today}`;
            } else if (viewMode === 'Past') {
                // For simplicity, we'll just fetch all and filter in JS if needed, 
                // but let's assume we want real data.
            }

            const [evRes, venRes] = await Promise.all([
                fetch(url),
                fetch('/api/venues')
            ]);

            const evData = await evRes.json() as Event[];
            const venData = await venRes.json() as Venue[];

            if (viewMode === 'Past') {
                setEvents(evData.filter(e => e.date < today).reverse());
            } else if (viewMode === 'All') {
                setEvents(evData);
            } else {
                setEvents(evData);
            }
            setVenues(venData);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateEvent = async (dto: Partial<CreateEventDTO>) => {
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error("Failed to create event:", err);
        }
    };

    const filteredEvents = events.filter(e =>
        e.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.date.includes(searchQuery)
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Global Events</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Monitor staffing health across all Nara venues.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
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
                        placeholder="Search venues or dates..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', height: '44px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                </div>
            ) : (
                <div className={styles.eventGrid}>
                    {filteredEvents.map(event => (
                        <Link href={`/admin/events/${event.id}`} key={event.id} style={{ textDecoration: 'none' }}>
                            <div className={styles.eventCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.venueTag}>{event.venue_name}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{event.priority}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <h3 className={styles.eventTitle}>{event.venue_name} Event</h3>
                                    <div className={styles.infoRow}>
                                        <Calendar size={16} /> <span>{event.date}</span>
                                        <Clock size={16} style={{ marginLeft: '1rem' }} /> <span>{event.start_time || 'TBD'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <Users size={16} /> <span>{event.guest_count} Guests</span>
                                    </div>

                                    <div className={`${styles.gapStatus} ${styles.gapWarning}`}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                                            <AlertTriangle size={16} />
                                            Planning In Progress
                                        </div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                            Staffing requirements being calculated
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)' }}>View Details</span>
                                    <ChevronRight size={18} style={{ color: '#cbd5e1' }} />
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredEvents.length === 0 && (
                        <div style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                            No events found for this selection.
                        </div>
                    )}
                </div>
            )}

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateEvent}
                venues={venues}
                editingEvent={null}
                selectedDate={new Date().toISOString().split('T')[0]}
            />
        </div>
    );
}
