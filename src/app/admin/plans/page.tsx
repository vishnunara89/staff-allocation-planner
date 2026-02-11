"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Loader2,
    Calendar,
    MapPin,
    UserCircle
} from "lucide-react";
import styles from "./plans.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import { Venue, Event, Plan } from "@/types";
import GeneratedPlanView from "@/components/GeneratedPlanView";

// Extended Plan interface to include generated_by_name from API
interface AdminPlan extends Plan {
    generated_by_name?: string;
    venue_id: number; // Ensure venue_id is present
}

export default function AdminPlansPage() {
    const [view, setView] = useState<'list' | 'generated'>('list');
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [plansMap, setPlansMap] = useState<Map<string, AdminPlan>>(new Map());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [filterVenue, setFilterVenue] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'generated' | 'not_generated'>('all');

    // State for viewing a plan
    const [currentPlan, setCurrentPlan] = useState<AdminPlan | null>(null);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [eventsRes, venuesRes, plansRes] = await Promise.all([
                fetch('/api/events'),
                fetch('/api/venues'),
                fetch('/api/plans')
            ]);

            const [eventsJson, venuesJson, plansJson] = await Promise.all([
                eventsRes.json().catch(() => []),
                venuesRes.json().catch(() => []),
                plansRes.json().catch(() => [])
            ]);

            // Sort events by date
            const sortedEvents = (Array.isArray(eventsJson) ? eventsJson : []).sort(
                (a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            setEvents(sortedEvents);
            setVenues(Array.isArray(venuesJson) ? venuesJson : []);

            // Create a Map of "date_venueId" -> Plan
            const pMap = new Map<string, AdminPlan>();
            if (Array.isArray(plansJson)) {
                plansJson.forEach((p: any) => {
                    const key = `${p.event_date}_${p.venue_id}`;
                    pMap.set(key, p);
                });
            }
            setPlansMap(pMap);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || `ID: ${id}`;

    function formatTimeDisplay(timeStr?: string) {
        if (!timeStr) return 'TBD';
        const [h, m] = timeStr.split(':');
        const date = new Date();
        date.setHours(Number(h));
        date.setMinutes(Number(m));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const filteredEvents = events.filter(event => {
        const venueName = getVenueName(event.venue_id)?.toLowerCase() || "";
        const matchesSearch = venueName.includes(searchQuery.toLowerCase()) ||
            (event.date || "").includes(searchQuery);

        const matchesVenue = !filterVenue || event.venue_id === Number(filterVenue);

        const planKey = `${event.date}_${event.venue_id}`;
        const hasPlan = plansMap.has(planKey);

        let matchesStatus = true;
        if (filterStatus === 'generated') matchesStatus = hasPlan;
        if (filterStatus === 'not_generated') matchesStatus = !hasPlan;

        return matchesSearch && matchesVenue && matchesStatus;
    });

    const handleViewPlan = (event: Event) => {
        const key = `${event.date}_${event.venue_id}`;
        const plan = plansMap.get(key);
        if (plan) {
            setCurrentPlan(plan);
            setCurrentEvent(event);
            setView('generated');
        }
    };

    if (loading) {
        return (
            <div className={styles.container} style={{ height: '80vh', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {view === 'list' ? (
                <>
                    <header className={styles.header}>
                        <div>
                            <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2.5rem', fontWeight: 500, margin: 0, color: '#2D2D2D' }}>
                                Staffing Plans
                            </h2>
                            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                                Review and manage staffing allocations for all events.
                            </p>
                        </div>
                    </header>

                    <div className={styles.filterBar}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search by venue or date..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <CustomDropdown
                            options={venues}
                            value={filterVenue}
                            onChange={setFilterVenue}
                            placeholder="All Venues"
                        />
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.3rem', borderRadius: '12px', gap: '0.3rem' }}>
                            <button
                                onClick={() => setFilterStatus('all')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', background: filterStatus === 'all' ? 'white' : 'transparent',
                                    borderRadius: '9px', fontWeight: filterStatus === 'all' ? 600 : 500,
                                    color: filterStatus === 'all' ? '#7C4C2C' : '#64748b', cursor: 'pointer',
                                    boxShadow: filterStatus === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterStatus('generated')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', background: filterStatus === 'generated' ? 'white' : 'transparent',
                                    borderRadius: '9px', fontWeight: filterStatus === 'generated' ? 600 : 500,
                                    color: filterStatus === 'generated' ? '#7C4C2C' : '#64748b', cursor: 'pointer',
                                    boxShadow: filterStatus === 'generated' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Generated
                            </button>
                            <button
                                onClick={() => setFilterStatus('not_generated')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', background: filterStatus === 'not_generated' ? 'white' : 'transparent',
                                    borderRadius: '9px', fontWeight: filterStatus === 'not_generated' ? 600 : 500,
                                    color: filterStatus === 'not_generated' ? '#7C4C2C' : '#64748b', cursor: 'pointer',
                                    boxShadow: filterStatus === 'not_generated' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Missing
                            </button>
                        </div>
                    </div>

                    <div className={styles.eventsList}>
                        {filteredEvents.map(event => {
                            const key = `${event.date}_${event.venue_id}`;
                            const plan = plansMap.get(key);
                            const hasPlan = !!plan;

                            return (
                                <div key={event.id} className={styles.eventCard}>
                                    <div className={styles.eventTime}>
                                        <Calendar size={14} />
                                        {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                        {formatTimeDisplay(event.start_time)}
                                    </div>

                                    <div className={styles.venueName}>{getVenueName(event.venue_id)}</div>

                                    <div className={styles.guestCount}>
                                        <MapPin size={16} /> {getVenueName(event.venue_id)}
                                        <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                                        👤 <strong>{event.guest_count}</strong> Guests
                                    </div>

                                    {/* Status Section */}
                                    <div style={{ marginTop: 'auto' }}>
                                        {hasPlan ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <span className={`${styles.statusBadge} ${styles.statusGenerated}`}>
                                                    ✓ Plan Generated
                                                </span>
                                                {plan?.generated_by_name && (
                                                    <div className={styles.generatedBy}>
                                                        <UserCircle size={14} />
                                                        Generated by <strong>{plan.generated_by_name}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={`${styles.statusBadge} ${styles.statusNotGenerated}`}>
                                                • Plan Not Generated
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.cardActions}>
                                        {hasPlan ? (
                                            <button
                                                className={styles.buttonPrimary}
                                                onClick={() => handleViewPlan(event)}
                                            >
                                                View Plan →
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => alert('Admins can view generated plans. To create a plan, please ask the venue manager or switch to Manager view.')}
                                                style={{
                                                    background: 'transparent', border: '1px solid #e2e8f0',
                                                    padding: '0.6rem 1.2rem', borderRadius: '12px',
                                                    color: '#94a3b8', fontWeight: 600, fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                No Plan Available
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredEvents.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No events found matching your filters.
                        </div>
                    )}
                </>
            ) : (
                currentPlan && (
                    <GeneratedPlanView
                        plan={currentPlan}
                        onBack={() => { setView('list'); fetchData(); }}
                        onExport={() => { }}
                        eventName={currentEvent?.event_name || ''}
                        eventPriority={currentEvent?.priority || 'normal'}
                        eventStartTime={currentEvent?.start_time || ''}
                        eventEndTime={currentEvent?.end_time || ''}
                        onRefresh={fetchData}
                    />
                )
            )}
        </div>
    );
}
