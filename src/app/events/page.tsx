"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event, Venue, CreateEventDTO } from '@/types';
import styles from './events.module.css';
import EventModal from '@/components/EventModal';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
    const [reportingEvent, setReportingEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVenues();
    }, []);

    useEffect(() => {
        fetchEvents(selectedDate);
    }, [selectedDate]);

    async function fetchVenues() {
        try {
            const res = await fetch('/api/venues');
            if (res.ok) setVenues(await res.json());
        } catch (e) {
            console.error('Failed to fetch venues', e);
        }
    }

    async function fetchEvents(date: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/events?date=${date}`);
            if (res.ok) setEvents(await res.json());
        } catch (e) {
            console.error('Failed to fetch events', e);
        } finally {
            setLoading(false);
        }
    }

    const handleSaveEvent = async (formData: Partial<CreateEventDTO>) => {
        const url = editingEvent?.id ? `/api/events/${editingEvent.id}` : '/api/events';
        const method = editingEvent?.id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                date: selectedDate
            })
        });

        const saved = await res.json();
        if (saved.error) throw new Error(saved.error);

        if (editingEvent?.id) {
            setEvents(events.map(ev => ev.id === editingEvent.id ? saved : ev));
        } else {
            setEvents([...events, saved]);
        }
    };

    async function handleDeleteEvent(id: number) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' });
            setEvents(events.filter(e => e.id !== id));
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
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className={styles.dateInput}
                    />
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

            <div className={styles.eventsList}>
                {loading ? (
                    <div className={styles.emptyState}>Loading your events...</div>
                ) : events.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                        No events scheduled for this day.
                        <br />
                        <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Select another date or create a new event to get started.</span>
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className={`${styles.eventCard} ${styles[event.priority]}`}>
                            <div className={styles.eventTime}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                {formatTimeDisplay(event.start_time)} — {formatTimeDisplay(event.end_time)}
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
                                    {getReqsSummary(event.special_requirements).length === 0 && (
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Standard staffing rules apply</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    onClick={() => setReportingEvent(event)}
                                    className={styles.btnReport}
                                >
                                    See Report
                                </button>

                                <Link
                                    href={`/plans?date=${selectedDate}`}
                                    className={styles.btnPlan}
                                >
                                    Generate
                                </Link>

                                <button
                                    onClick={() => {
                                        setEditingEvent(event);
                                        setIsModalOpen(true);
                                    }}
                                    className={styles.btnEdit}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit
                                </button>

                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className={styles.btnDelete}
                                    title="Delete Event"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                venues={venues}
                editingEvent={editingEvent}
                selectedDate={selectedDate}
            />
        </div>
    );
}
