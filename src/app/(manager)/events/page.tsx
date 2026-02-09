"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Event, Venue, CreateEventDTO } from '@/types';
import styles from './events.module.css';
import EventModal from '@/components/EventModal';
import EventReportModal from '@/components/EventReportModal';

type ViewMode = 'upcoming' | 'past' | 'all';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [reportingEvent, setReportingEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [viewMode]);

    async function fetchVenues() {
        try {
            const res = await fetch('/api/venues');
            if (res.ok) setVenues(await res.json());
        } catch (e) {
            console.error('Failed to fetch venues', e);
        }
    }

    async function fetchEvents() {
        setLoading(true);
        try {
            let url = '/api/events';

            // Optimization: Use server-side filtering for upcoming
            if (viewMode === 'upcoming') {
                const today = new Date().toISOString().split('T')[0];
                url += `?from_date=${today}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (e) {
            console.error('Failed to fetch events', e);
        } finally {
            setLoading(false);
        }
    }

    const filteredEvents = useMemo(() => {
        let filtered = [...events];

        // 1. Client-side Date Filtering for Passed/All if needed
        const today = new Date().toISOString().split('T')[0];
        if (viewMode === 'past') {
            filtered = filtered.filter(e => e.date < today);
        }
        // 'upcoming' is handled by API, 'all' needs no filter

        // 2. Search Filtering
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(e =>
                e.venue_name?.toLowerCase().includes(lowerTerm) ||
                e.special_requirements?.toLowerCase().includes(lowerTerm) ||
                e.date.includes(lowerTerm)
            );
        }

        // 3. Sorting
        filtered.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.start_time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.start_time || '00:00'}`);
            return viewMode === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        return filtered;
    }, [events, viewMode, searchTerm]);

    // Grouping for Layout
    const groupedEvents = useMemo(() => {
        const groups: { [key: string]: Event[] } = {};
        filteredEvents.forEach(event => {
            const date = new Date(event.date);
            // Group by Month + Year for broader view? Or by Week?
            // User wants "Latest" and "Upcoming". 
            // Let's use relative dates: "Today", "Tomorrow", "This Week", "Later"

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const eventDate = new Date(event.date);
            eventDate.setHours(0, 0, 0, 0);

            const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            let groupName = '';
            if (viewMode === 'past') {
                groupName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            } else {
                if (diffDays === 0) groupName = "Today";
                else if (diffDays === 1) groupName = "Tomorrow";
                else if (diffDays > 1 && diffDays < 7) groupName = "This Week";
                else if (diffDays >= 7 && diffDays < 14) groupName = "Next Week";
                else groupName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }

            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push(event);
        });
        return groups;
    }, [filteredEvents, viewMode]);


    const handleSaveEvent = async (formData: Partial<CreateEventDTO>) => {
        const url = editingEvent?.id ? `/api/events/${editingEvent.id}` : '/api/events';
        const method = editingEvent?.id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const saved = await res.json();
        if (saved.error) throw new Error(saved.error);

        // Refresh events
        fetchEvents();
    };

    async function handleDeleteEvent(id: number) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            fetchEvents(); // Refresh events after deletion
        } catch (e) {
            console.error('Failed to delete event', e);
        }
    }

    function formatTimeDisplay(timeStr?: string) {
        if (!timeStr) return 'TBD';
        const [h, m] = timeStr.split(':');
        const date = new Date();
        date.setHours(Number(h));
        date.setMinutes(Number(m));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || 'Unknown Location';

    const getReqsSummary = (reqsString?: string) => {
        try {
            if (!reqsString || !reqsString.startsWith('[')) return [];
            const parsed = JSON.parse(reqsString);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <h2>Events Planner</h2>
                </div>
                <div className={styles.controls}>
                    <button
                        onClick={() => {
                            setEditingEvent(null);
                            setIsModalOpen(true);
                        }}
                        className={styles.buttonPrimary}
                    >
                        + New Event
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
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

            {/* Content Area */}
            {loading ? (
                <div className={styles.emptyState} style={{ border: 'none', background: 'transparent' }}>
                    Loading events...
                </div>
            ) : Object.keys(groupedEvents).length === 0 ? (
                <div className={styles.emptyState}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    No events found matching your criteria.
                </div>
            ) : (
                Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
                    <div key={groupName}>
                        <div className={styles.sectionTitle}>{groupName}</div>
                        <div className={styles.eventsList}>
                            {groupEvents.map(event => (
                                <div key={event.id} className={`${styles.eventCard} ${styles[event.priority]}`}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div className={styles.eventTime}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {formatTimeDisplay(event.start_time)} — {formatTimeDisplay(event.end_time)}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                            {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>

                                    <div className={styles.eventInfo}>
                                        <div className={styles.venueName}>{getVenueName(event.venue_id)}</div>
                                        <div className={styles.guestCount}>
                                            👤 <strong>{event.guest_count}</strong> Guests expected
                                        </div>

                                        <div className={styles.reqsSummary}>
                                            {getReqsSummary(event.special_requirements).map((r: any, idx: number) => (
                                                <span key={idx} className={styles.reqMiniBadge}>
                                                    {r.quantity}x {r.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button
                                            onClick={() => setReportingEvent(event)}
                                            className={styles.btnReport}
                                        >
                                            Report
                                        </button>

                                        <button
                                            onClick={() => {
                                                setEditingEvent(event);
                                                setIsModalOpen(true);
                                            }}
                                            className={styles.btnEdit}
                                            title="Edit Event"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>

                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            className={styles.btnDelete}
                                            title="Delete Event"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
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
                        </div>
                    </div>
                ))
            )}

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                venues={venues}
                editingEvent={editingEvent}
                selectedDate={new Date().toISOString().split('T')[0]}
            />

            <EventReportModal
                event={reportingEvent}
                onClose={() => setReportingEvent(null)}
                venues={venues}
            />
        </div>
    );
}
