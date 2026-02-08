"use client";

import { useEffect, useState, FormEvent } from 'react';
import { Event, Venue, CreateEventDTO } from '@/types';
import styles from './events.module.css';

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingEventId, setEditingEventId] = useState<number | null>(null);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<CreateEventDTO>>({
        guest_count: 0,
        priority: 'normal'
    });

    const [showReqPicker, setShowReqPicker] = useState(false);
    const [reqSearch, setReqSearch] = useState('');
    const [reqOptions, setReqOptions] = useState<any[]>([]);

    useEffect(() => {
        fetchVenues();
        fetchReqOptions();
    }, []);

    useEffect(() => {
        fetchEvents(selectedDate);
    }, [selectedDate]);

    async function fetchReqOptions() {
        try {
            const res = await fetch('/api/requirements');
            if (res.ok) setReqOptions(await res.json());
        } catch (e) { }
    }

    async function fetchVenues() {
        const res = await fetch('/api/venues');
        if (res.ok) setVenues(await res.json());
    }

    async function fetchEvents(date: string) {
        const res = await fetch(`/api/events?date=${date}`);
        if (res.ok) setEvents(await res.json());
    }

    function formatTimeDisplay(timeStr?: string) {
        if (!timeStr) return 'TBD';
        const [h, m] = timeStr.split(':');
        const date = new Date();
        date.setHours(Number(h));
        date.setMinutes(Number(m));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    async function handleSaveEvent(e: FormEvent) {
        e.preventDefault();
        try {
            const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
            const method = editingEventId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEvent,
                    date: selectedDate
                })
            });
            const savedEvent = await res.json();
            if (savedEvent.error) throw new Error(savedEvent.error);

            if (editingEventId) {
                setEvents(events.map(ev => ev.id === editingEventId ? savedEvent : ev));
            } else {
                setEvents([...events, savedEvent]);
            }

            setShowAddEvent(false);
            setEditingEventId(null);
            setNewEvent({ guest_count: 0, priority: 'normal' });
        } catch (err) {
            alert('Failed to save event');
            console.error(err);
        }
    }

    async function handleDeleteEvent(id: number) {
        if (!confirm('Delete this event?')) return;
        await fetch(`/api/events/${id}`, { method: 'DELETE' });
        setEvents(events.filter(e => e.id !== id));
    }

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || 'Unknown Venue';

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Events Planner</h2>
                <div className={styles.controls}>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className={styles.dateInput}
                    />
                    <button onClick={() => {
                        setShowAddEvent(!showAddEvent);
                        setEditingEventId(null);
                        setNewEvent({ guest_count: 0, priority: 'normal' });
                    }} className={styles.buttonPrimary}>
                        {showAddEvent ? 'Cancel' : '+ New Event'}
                    </button>
                </div>
            </header>

            {showAddEvent && (
                <div className={styles.modalOverlay}>
                    <form onSubmit={handleSaveEvent} className={styles.form}>
                        <h3>{editingEventId ? 'Edit Event' : 'Add Event'} for {selectedDate}</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Venue</label>
                                <select
                                    required
                                    value={newEvent.venue_id || ''}
                                    onChange={e => setNewEvent({ ...newEvent, venue_id: Number(e.target.value) })}
                                >
                                    <option value="">Select Venue...</option>
                                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Guest Count</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="1"
                                    value={newEvent.guest_count}
                                    onChange={e => {
                                        const val = Math.max(0, Math.floor(Number(e.target.value)));
                                        setNewEvent({ ...newEvent, guest_count: val });
                                    }}
                                />
                                {newEvent.guest_count !== undefined && newEvent.guest_count <= 0 && (
                                    <span className={styles.errorText}>Must be at least 1 guest</span>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    required
                                    step="60"
                                    value={newEvent.start_time || ''}
                                    onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                    placeholder="HH:MM"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>End Time</label>
                                <input
                                    type="time"
                                    required
                                    step="60"
                                    value={newEvent.end_time || ''}
                                    onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select
                                    value={newEvent.priority}
                                    onChange={e => setNewEvent({ ...newEvent, priority: e.target.value as any })}
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Requirements Section - V3 Picker */}
                            <div className={styles.fullWidthGroup}>
                                <label>Requirements</label>
                                <div className={styles.reqsContainer}>
                                    <button
                                        type="button"
                                        onClick={() => setShowReqPicker(true)}
                                        className={styles.buttonSecondary}
                                        style={{ width: '100%', marginBottom: '10px' }}
                                    >
                                        + Add Requirement
                                    </button>

                                    {/* Selected Requirements List */}
                                    <div className={styles.reqList}>
                                        {(() => {
                                            try {
                                                const reqs = newEvent.special_requirements ?
                                                    (typeof newEvent.special_requirements === 'string' && newEvent.special_requirements.startsWith('[') ?
                                                        JSON.parse(newEvent.special_requirements) : [])
                                                    : [];

                                                if (Array.isArray(reqs)) {
                                                    return reqs.map((r: any, idx: number) => (
                                                        <div key={idx} className={styles.reqTag}>
                                                            <strong>{r.quantity}x</strong> {r.value} <span className={styles.reqType}>({r.type})</span>
                                                            <span onClick={() => {
                                                                const newReqs = [...reqs];
                                                                newReqs.splice(idx, 1);
                                                                setNewEvent({ ...newEvent, special_requirements: JSON.stringify(newReqs) });
                                                            }} className={styles.removeReq}>×</span>
                                                        </div>
                                                    ));
                                                }
                                            } catch (e) { return null; }
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Requirements Picker Modal */}
                            {showReqPicker && (
                                <div className={styles.pickerOverlay}>
                                    <div className={styles.pickerModal}>
                                        <div className={styles.pickerHeader}>
                                            <h4>Select Requirement</h4>
                                            <button type="button" onClick={() => setShowReqPicker(false)}>×</button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search skills, languages..."
                                            className={styles.pickerSearch}
                                            autoFocus
                                            onChange={e => setReqSearch(e.target.value)}
                                        />

                                        <div className={styles.pickerList}>
                                            {reqOptions.filter(o => o.value.toLowerCase().includes(reqSearch.toLowerCase())).map((opt, i) => (
                                                <div key={i} className={styles.pickerOption} onClick={() => {
                                                    const currentReqs = newEvent.special_requirements ?
                                                        (typeof newEvent.special_requirements === 'string' && newEvent.special_requirements.startsWith('[') ? JSON.parse(newEvent.special_requirements) : []) : [];

                                                    const existing = currentReqs.find((r: any) => r.value === opt.value && r.type === opt.type);
                                                    if (existing) {
                                                        existing.quantity += 1;
                                                    } else {
                                                        currentReqs.push({ type: opt.type, value: opt.value, quantity: 1 });
                                                    }

                                                    setNewEvent({ ...newEvent, special_requirements: JSON.stringify(currentReqs) });
                                                    setShowReqPicker(false);
                                                    setReqSearch('');
                                                }}>
                                                    <span className={styles.optType}>{opt.type}</span>
                                                    <span className={styles.optValue}>{opt.value}</span>
                                                    {opt.available_internal !== undefined && (
                                                        <span className={`${styles.optAvail} ${opt.available_internal === 0 ? styles.none : ''}`}>
                                                            {opt.available_internal} available
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {reqSearch && !reqOptions.find(o => o.value.toLowerCase() === reqSearch.toLowerCase()) && (
                                                <div className={styles.pickerOption} onClick={async () => {
                                                    const res = await fetch('/api/requirements', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ type: 'other', value: reqSearch })
                                                    });
                                                    const newOpt = await res.json();
                                                    setReqOptions([...reqOptions, newOpt]);

                                                    const currentReqs = newEvent.special_requirements ?
                                                        (typeof newEvent.special_requirements === 'string' && newEvent.special_requirements.startsWith('[') ? JSON.parse(newEvent.special_requirements) : []) : [];
                                                    currentReqs.push({ type: 'other', value: reqSearch, quantity: 1 });
                                                    setNewEvent({ ...newEvent, special_requirements: JSON.stringify(currentReqs) });
                                                    setShowReqPicker(false);
                                                    setReqSearch('');
                                                }}>
                                                    <span className={styles.optType}>+ Create</span>
                                                    <span className={styles.optValue}>"{reqSearch}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                        <div className={styles.formActions}>
                            <button type="button" onClick={() => setShowAddEvent(false)} className={styles.buttonSecondary}>Cancel</button>
                            <button type="submit" className={styles.submitButton}>{editingEventId ? 'Save Changes' : 'Create Event'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.eventsList}>
                {events.length === 0 ? (
                    <div className={styles.emptyState}>No events scheduled for this day.</div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className={`${styles.eventCard} ${styles[event.priority]}`}>
                            <div className={styles.eventTime}>
                                {formatTimeDisplay(event.start_time)} - {formatTimeDisplay(event.end_time)}
                            </div>
                            <div className={styles.eventInfo}>
                                <div className={styles.venueName}>{getVenueName(event.venue_id)}</div>
                                <div className={styles.guestCount}>{event.guest_count} Guests</div>
                                {event.special_requirements && (
                                    <div className={styles.reqs}>Note: {event.special_requirements}</div>
                                )}
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => {
                                    setNewEvent(event);
                                    setEditingEventId(event.id);
                                    setShowAddEvent(true);
                                }} className={styles.buttonSecondary} style={{ marginRight: '5px' }}>Edit</button>
                                <button onClick={() => handleDeleteEvent(event.id)} className={styles.deleteButton}>×</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
