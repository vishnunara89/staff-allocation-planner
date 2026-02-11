"use strict";
"use client";

import { useState, useEffect } from 'react';
import { Event, Venue, Role, Plan, PlanAssignment, StaffMember, StaffingRule, PlanRequirement } from '@/types';
import styles from './plans.module.css';
import eventStyles from '../events/events.module.css';
import NewPlanModal from '@/components/NewPlanModal';
import GeneratedPlanView from '@/components/GeneratedPlanView';
import Link from 'next/link';

export default function PlansPage() {
    const [view, setView] = useState<'list' | 'generated'>('list');
    const [filterStatus, setFilterStatus] = useState<'all' | 'generated' | 'not_generated'>('all');
    const [events, setEvents] = useState<Event[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [existingPlans, setExistingPlans] = useState<Set<string>>(new Set());

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();

        // Handle deep link from Events page
        const params = new URLSearchParams(window.location.search);
        const autoDate = params.get('date');
        if (autoDate && events.length > 0) {
            const linkedEvent = events.find(e => e.date === autoDate);
            if (linkedEvent) {
                handleGeneratePlan(linkedEvent);
            }
        }
    }, [events.length]); // Re-run when events are loaded

    async function fetchData() {
        setLoading(true);
        try {
            const [eventsRes, venuesRes, plansRes, rolesRes] = await Promise.all([
                fetch('/api/events'),
                fetch('/api/venues'),
                fetch('/api/plans'),
                fetch('/api/roles')
            ]);

            if (eventsRes.ok && venuesRes.ok && rolesRes.ok) {
                const eventsData = await eventsRes.json();
                const venuesData = await venuesRes.json();
                const rolesData = await rolesRes.json();
                setRoles(rolesData);

                // Process plans
                if (plansRes.ok) {
                    const plansData = await plansRes.json();
                    const plansSet = new Set<string>();
                    plansData.forEach((p: any) => plansSet.add(`${p.event_date}_${p.venue_id}`));
                    setExistingPlans(plansSet);
                }
                // Sort events by date
                eventsData.sort((a: Event, b: Event) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setEvents(eventsData);
                setVenues(venuesData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleGeneratePlan = async (event: Event) => {
        // MVP Logic: Generate plan client-side (mocking the complex backend logic for now)
        setLoading(true);
        try {
            // 1. Fetch Staff, Rules, and Manning Tables
            const [staffRes, rulesRes, manningRes] = await Promise.all([
                fetch('/api/staff'),
                fetch('/api/rules'),
                fetch(`/api/manning-tables?venue_id=${event.venue_id}`)
            ]);

            const staffList: StaffMember[] = await staffRes.json();
            const rulesList: StaffingRule[] = await rulesRes.json();
            const manningTables = await manningRes.json();

            let requirements: PlanRequirement[] = [];

            // 2. Determine Requirements
            if (manningTables && manningTables.length > 0) {
                // EXCEL RULE LOGIC
                console.log('Using Excel Manning Rules for plan generation');
                const reqMap = new Map<number, number>();

                manningTables.forEach((table: any) => {
                    const config = table.config;
                    const brackets = config.brackets;

                    // a. Find the matching bracket index
                    let bracketIndex = -1;
                    for (let i = 0; i < brackets.length; i++) {
                        const [min, max] = brackets[i].split('-').map(Number);
                        if (event.guest_count >= min && (event.guest_count <= max || i === brackets.length - 1)) {
                            bracketIndex = i;
                            break;
                        }
                    }

                    if (bracketIndex !== -1) {
                        // b. Map roles and counts
                        config.rows.forEach((row: any) => {
                            const roleName = row.role.toUpperCase().trim();
                            // Find role ID by name
                            const role = roles.find(r => r.name.toUpperCase().trim() === roleName);
                            if (role) {
                                const count = row.counts[bracketIndex];
                                if (count > 0) {
                                    reqMap.set(role.id, (reqMap.get(role.id) || 0) + count);
                                }
                            } else {
                                console.warn(`Role mapping failed for: ${row.role}`);
                            }
                        });
                    }
                });

                // Convert map to requirements
                requirements = Array.from(reqMap.entries()).map(([roleId, count]) => ({
                    role_id: roleId,
                    role_name: getRoleName(roleId),
                    count: count,
                    filled: 0,
                    assignments: [] as PlanAssignment[]
                }));
            } else {
                // FALLBACK TO RATIO RULES
                console.log('No Excel Manning Rules found, falling back to staffing rules (ratio)');
                const eventRules = rulesList.filter(r => r.venue_id === event.venue_id);
                requirements = eventRules.map(rule => {
                    const count = Math.ceil(event.guest_count / rule.ratio_guests);
                    const roleName = getRoleName(rule.role_id);
                    return {
                        role_id: rule.role_id,
                        role_name: roleName,
                        count: count,
                        filled: 0,
                        assignments: [] as PlanAssignment[]
                    };
                });
            }

            // 3. Assign Staff (Greedy Algorithm for MVP)
            let assignedStaffIds = new Set<number>();


            // Helper to find staff
            const findStaff = (roleId: number, count: number, reqIndex: number) => {
                let needed = count;
                // a. Prioritize Home Base
                const homeBaseStaff = staffList.filter(s =>
                    !assignedStaffIds.has(s.id) &&
                    s.home_base_venue_id === event.venue_id &&
                    (s.primary_role_id === roleId || s.secondary_roles.includes(roleId))
                );

                for (const staff of homeBaseStaff) {
                    if (needed <= 0) break;
                    assignedStaffIds.add(staff.id);
                    requirements[reqIndex].assignments.push({
                        role_id: roleId,
                        role_name: requirements[reqIndex].role_name,
                        staff_id: staff.id,
                        staff_name: staff.full_name,
                        status: 'pending',
                        is_freelance: false
                    });
                    needed--;
                }

                // b. Other Internal Staff
                if (needed > 0) {
                    const otherStaff = staffList.filter(s =>
                        !assignedStaffIds.has(s.id) &&
                        (s.primary_role_id === roleId || s.secondary_roles.includes(roleId))
                    );

                    for (const staff of otherStaff) {
                        if (needed <= 0) break;
                        assignedStaffIds.add(staff.id);
                        requirements[reqIndex].assignments.push({
                            role_id: roleId,
                            role_name: requirements[reqIndex].role_name,
                            staff_id: staff.id,
                            staff_name: staff.full_name,
                            status: 'pending',
                            is_freelance: false
                        });
                        needed--;
                    }
                }

                // c. Freelancers
                while (needed > 0) {
                    requirements[reqIndex].assignments.push({
                        role_id: roleId,
                        role_name: requirements[reqIndex].role_name,
                        staff_id: -Math.random(), // Temp ID
                        staff_name: 'Freelancer Needed',
                        status: 'pending',
                        is_freelance: true
                    });
                    needed--;
                }
            };

            requirements.forEach((req, idx) => {
                findStaff(req.role_id, req.count, idx);
            });

            const newPlan: Plan = {
                event_id: event.id,
                event_date: event.date,
                venue_name: getVenueName(event.venue_id),
                guest_count: event.guest_count,
                requirements: requirements,
                total_staff: requirements.reduce((acc, r) => acc + r.assignments.length, 0),
                total_freelancers: requirements.reduce((acc, r) => acc + r.assignments.filter((a: PlanAssignment) => a.is_freelance).length, 0),
                status: 'draft'
            };

            // 4. Save to Database for persistence
            try {
                await fetch('/api/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_id: event.id,
                        date: event.date,
                        venue_id: event.venue_id,
                        assignments: requirements.flatMap(r => r.assignments).map(a => ({
                            staff_id: a.staff_id > 0 ? a.staff_id : null,
                            role_id: a.role_id,
                            venue_id: event.venue_id,
                            reason: 'Auto-generated'
                        }))
                    })
                });
            } catch (saveError) {
                console.error('Failed to persist plan:', saveError);
            }

            setCurrentPlan(newPlan);
            setCurrentEvent(event);

            // 5. Update local state to reflect the new plan immediately
            const planKey = `${event.date}_${event.venue_id}`;
            console.log('Generating plan for key:', planKey);

            const newSet = new Set(existingPlans);
            newSet.add(planKey);
            setExistingPlans(newSet);

            setView('generated');
            setIsModalOpen(false);

        } catch (e) {
            console.error('Plan generation failed', e);
            alert('Failed to generate plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper mappings
    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || 'Unknown Venue';
    const getRoleName = (id: number) => {
        return roles.find(r => r.id === id)?.name || 'Staff';
    };

    function formatTimeDisplay(timeStr?: string) {
        if (!timeStr) return 'TBD';
        const [h, m] = timeStr.split(':');
        const date = new Date();
        date.setHours(Number(h));
        date.setMinutes(Number(m));
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    const filteredEvents = events.filter(e => {
        const venue = getVenueName(e.venue_id).toLowerCase();
        const matchesSearch = venue.includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const hasPlan = existingPlans.has(`${e.date}_${e.venue_id}`);
        if (filterStatus === 'generated') return hasPlan;
        if (filterStatus === 'not_generated') return !hasPlan;

        return true;
    });

    // Sub-components for List View
    const renderListView = () => (
        <>
            <div className={styles.header}>
                <div>
                    <h2>Staffing Plans</h2>
                    <p style={{ color: '#64748b' }}>Manage staffing for upcoming events</p>
                </div>
                <div className={styles.controls}>
                    <button className={styles.buttonPrimary} onClick={() => setIsModalOpen(true)}>
                        + New Plan
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className={eventStyles.filterBar} style={{ marginBottom: '2rem' }}>
                <div className={eventStyles.searchWrapper} style={{ flex: 1 }}>
                    <span className={eventStyles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search plans by venue..."
                        className={eventStyles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={eventStyles.viewToggle}>
                    <button
                        className={`${eventStyles.toggleBtn} ${filterStatus === 'all' ? eventStyles.active : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${eventStyles.toggleBtn} ${filterStatus === 'generated' ? eventStyles.active : ''}`}
                        onClick={() => setFilterStatus('generated')}
                    >
                        Generated
                    </button>
                    <button
                        className={`${eventStyles.toggleBtn} ${filterStatus === 'not_generated' ? eventStyles.active : ''}`}
                        onClick={() => setFilterStatus('not_generated')}
                    >
                        Not Generated
                    </button>
                </div>
            </div>

            {/* Events Grid */}
            <div className={eventStyles.eventsList}>
                {filteredEvents.map(event => (
                    <div key={event.id} className={eventStyles.eventCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div className={eventStyles.eventTime}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                                {formatTimeDisplay(event.start_time)} — {formatTimeDisplay(event.end_time)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                        </div>

                        <div className={eventStyles.eventInfo}>
                            <div className={eventStyles.venueName}>{getVenueName(event.venue_id)}</div>
                            <div className={eventStyles.guestCount}>
                                👤 <strong>{event.guest_count}</strong> Guests expected
                            </div>

                            {/* Plan Status Badge */}
                            {(() => {
                                const key = `${event.date}_${event.venue_id}`;
                                const hasPlan = existingPlans.has(key);
                                return hasPlan ? (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: '#ecfdf5',
                                        color: '#047857', // Green
                                        marginTop: '1rem',
                                        border: '1px solid #a7f3d0',
                                        width: 'fit-content'
                                    }}>
                                        ✓ Plan Generated
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        marginTop: '1rem',
                                        border: '1px solid #e2e8f0',
                                        width: 'fit-content'
                                    }}>
                                        • Plan Not Generated
                                    </div>
                                );
                            })()}
                        </div>

                        <div className={eventStyles.cardActions}>
                            <button
                                className={styles.buttonPrimary}
                                style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
                                onClick={() => handleGeneratePlan(event)}
                            >
                                Generate Plan →
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredEvents.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    No events found to plan for.
                </div>
            )}
        </>
    );

    return (
        <div className={styles.container}>
            {view === 'list' && renderListView()}

            {view === 'generated' && currentPlan && (
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
            )}

            <NewPlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onGenerate={handleGeneratePlan}
                venues={venues}
                existingPlans={existingPlans}
            />
        </div>
    );
}
