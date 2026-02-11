"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Calendar,
    Search,
    ChevronRight,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle2,
    Plus,
    Loader2,
    MapPin,
    Pencil,
    X
} from "lucide-react";
import styles from "./events.module.css";
import Link from "next/link";
import EventModal from "@/components/EventModal";
import EventDetailModal from "@/components/EventDetailModal";
import { Event, Venue, CreateEventDTO } from "@/types";

export default function AdminEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    async function fetchData() {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            let url = '/api/events';

            if (viewMode === 'upcoming') {
                url += `?from_date=${today}`;
            }

            const [evRes, venRes] = await Promise.all([
                fetch(url),
                fetch('/api/venues')
            ]);

            const evJson = await evRes.json().catch(() => []);
            const venJson = await venRes.json().catch(() => []);

            const evData = Array.isArray(evJson) ? evJson : [];
            const venData = Array.isArray(venJson) ? venJson : [];

            if (viewMode === 'past') {
                setEvents(evData.filter((e: any) => e.date < today).reverse());
            } else {
                setEvents(evData);
            }
            setVenues(venData);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            setEvents([]);
            setVenues([]);
        } finally {
            setLoading(false);
        }
    }

    const handleSaveEvent = async (dto: Partial<CreateEventDTO>) => {
        try {
            const url = editingEvent?.id ? `/api/events/${editingEvent.id}` : '/api/events';
            const method = editingEvent?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto)
            });
            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
                setEditingEvent(null);
            }
        } catch (err) {
            console.error("Failed to save event:", err);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            console.error('Failed to delete event', e);
        }
    };

    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        // 1. Date Filtering
        const today = new Date().toISOString().split('T')[0];
        if (viewMode === 'upcoming') {
            filtered = filtered.filter(e => e.date >= today);
        } else if (viewMode === 'past') {
            filtered = filtered.filter(e => e.date < today);
        }

        // 2. Search Filtering
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.event_name?.toLowerCase().includes(lowerTerm) ||
                e.venue_name?.toLowerCase().includes(lowerTerm) ||
                e.special_requirements?.toLowerCase().includes(lowerTerm) ||
                e.date.includes(lowerTerm)
            );
        }

        // 3. Sorting (Matching Manager)
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.start_time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.start_time || '00:00'}`);
            return viewMode === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        return filtered;
    }, [events, viewMode, searchTerm]);

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

            {/* Filter Bar Unified */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search events by venue, requirements..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'upcoming' ? styles.active : ''}`}
                        onClick={() => setViewMode('upcoming')}
                    >
                        Upcoming
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'past' ? styles.active : ''}`}
                        onClick={() => setViewMode('past')}
                    >
                        Past
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${viewMode === 'all' ? styles.active : ''}`}
                        onClick={() => setViewMode('all')}
                    >
                        All
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                </div>
            ) : (
                <div className={styles.eventGrid}>
                    {filteredEvents.map(event => (
                        <div key={event.id} className={styles.eventCard}>
                            <div className={styles.eventTime}>
                                <Clock size={16} />
                                {(() => {
                                    const formatTime = (timeStr?: string) => {
                                        if (!timeStr) return 'TBD';
                                        const [h, m] = timeStr.split(':');
                                        const d = new Date();
                                        d.setHours(Number(h));
                                        d.setMinutes(Number(m));
                                        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                    };
                                    return `${formatTime(event.start_time)} — ${formatTime(event.end_time)}`;
                                })()}
                                <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                            </div>

                            <div className={styles.eventInfo}>
                                <div className={styles.eventTitle}>{event.event_name || 'Untitled Event'}</div>
                                <div className={styles.venueSubtext}>
                                    <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                    {event.venue_name}
                                </div>
                                <div className={styles.guestCount}>
                                    <Users size={16} />
                                    <strong>{event.guest_count}</strong> Guests expected
                                </div>

                                <div className={styles.reqsSummary}>
                                    {(() => {
                                        try {
                                            if (!event.special_requirements || !event.special_requirements.startsWith('[')) return [];
                                            const parsed = JSON.parse(event.special_requirements);
                                            return Array.isArray(parsed) ? parsed : [];
                                        } catch (e) { return []; }
                                    })().map((r: any, idx: number) => (
                                        <span key={idx} className={styles.reqMiniBadge}>
                                            {r.quantity}x {r.skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    onClick={() => setViewingEvent(event)}
                                    className={styles.btnView}
                                >
                                    View
                                </button>

                                <button
                                    onClick={() => {
                                        setEditingEvent(event);
                                        setIsModalOpen(true);
                                    }}
                                    className={styles.btnEdit}
                                    title="Edit Event"
                                >
                                    <Pencil size={18} />
                                </button>

                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className={styles.btnDelete}
                                    title="Delete Event"
                                >
                                    <X size={20} />
                                </button>

                                <Link
                                    href={`/plans?date=${event.date}`}
                                    className={styles.btnPlan}
                                >
                                    Generate Plan
                                </Link>
                            </div>
                        </div>
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
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                }}
                onSave={handleSaveEvent}
                venues={venues}
                editingEvent={editingEvent}
                selectedDate={new Date().toISOString().split('T')[0]}
            />

            <EventDetailModal
                event={viewingEvent}
                onClose={() => setViewingEvent(null)}
                venues={venues}
                onEdit={(ev) => {
                    setEditingEvent(ev);
                    setIsModalOpen(true);
                }}
            />
        </div>
    );
}
