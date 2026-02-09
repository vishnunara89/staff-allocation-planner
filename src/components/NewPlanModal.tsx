import React, { useState, useEffect } from 'react';
import { Event, Venue } from '@/types';
// We'll reuse the events module css for consistency
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
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading events...</div>
                    ) : events.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
                            No upcoming events found. <br /> Please create an event first.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    style={{
                                        border: selectedEventId === event.id ? '2px solid #7C4C2C' : '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        backgroundColor: selectedEventId === event.id ? '#fffaf8' : 'white',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#2D2D2D', fontSize: '1.1rem' }}>
                                            {getVenueName(event.venue_id)}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.2rem' }}>
                                            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            <span style={{ margin: '0 0.5rem' }}>•</span>
                                            {event.start_time} - {event.end_time}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#7C4C2C', marginTop: '0.4rem', fontWeight: 500 }}>
                                            👤 {event.guest_count} Guests
                                        </div>
                                    </div>

                                    {selectedEventId === event.id && (
                                        <div style={{ color: '#7C4C2C', fontSize: '1.5rem' }}>✓</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className={styles.buttonCancel} onClick={onClose}>Cancel</button>
                    <button
                        className={styles.buttonSubmit}
                        disabled={!selectedEventId}
                        onClick={handleGenerate}
                        style={{ opacity: !selectedEventId ? 0.5 : 1 }}
                    >
                        Generate Plan
                    </button>
                </div>
            </div>
        </div>
    );
}
