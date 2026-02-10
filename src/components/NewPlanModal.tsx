import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, Users, Clock } from 'lucide-react';
import { Event, Venue } from '@/types';
import styles from '../app/(manager)/events/events.module.css';

interface NewPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (event: Event) => void;
    venues: Venue[];
    existingPlans: Set<string>;
}

export default function NewPlanModal({ isOpen, onClose, onGenerate, venues, existingPlans }: NewPlanModalProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchUpcomingEvents();
        }
    }, [isOpen]);

    async function fetchUpcomingEvents() {
        setLoading(true);
        try {
            const res = await fetch(`/api/events`);
            if (res.ok) {
                const data = await res.json();
                // Filter out events that already have plans
                const filteredData = data.filter((e: Event) => !existingPlans.has(`${e.date}_${e.venue_id}`));
                // Sort by date asc
                filteredData.sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setEvents(filteredData);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleGenerate = () => {
        const event = events.find(e => e.id === selectedEventId);
        if (event) {
            onGenerate(event);
        }
    };

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || 'Unknown';

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <h3>New Staffing Plan</h3>
                        <p>Select an upcoming event to generate a plan for</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-color)' }}>
                            <div className="animate-spin" style={{ marginBottom: '1rem' }}>⌛</div>
                            Loading events...
                        </div>
                    ) : events.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-color)', border: '1.5px dashed var(--border-color)', borderRadius: '20px', background: '#F8FAFC' }}>
                            <Calendar size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p style={{ margin: 0, fontWeight: 500 }}>No upcoming events found.</p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Please create an event first.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    style={{
                                        border: '1.5px solid',
                                        borderColor: selectedEventId === event.id ? 'var(--primary-color)' : 'var(--border-color)',
                                        borderRadius: '16px',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        backgroundColor: selectedEventId === event.id ? 'rgba(124, 76, 44, 0.05)' : 'white',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--secondary-color)', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                                            {getVenueName(event.venue_id)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={14} />
                                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--muted-color)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Clock size={14} />
                                                {event.start_time} - {event.end_time}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '0.6rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Users size={14} />
                                            {event.guest_count} Guests
                                        </div>
                                    </div>

                                    {selectedEventId === event.id && (
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: 'var(--primary-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            <Check size={16} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="secondary" style={{ height: '48px', padding: '0 2rem' }} onClick={onClose}>Cancel</button>
                    <button
                        style={{ height: '48px', padding: '0 2rem' }}
                        disabled={!selectedEventId}
                        onClick={handleGenerate}
                    >
                        Generate Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
