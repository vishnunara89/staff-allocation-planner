"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Zap, MapPin, Briefcase } from 'lucide-react';
import { Event, Venue, Role } from '@/types';
import styles from '../app/(manager)/events/events.module.css';

interface EventDetailModalProps {
    event: Event | null;
    onClose: () => void;
    venues: Venue[];
    onEdit?: (event: Event) => void;
}

export default function EventDetailModal({ event, onClose, venues, onEdit }: EventDetailModalProps) {
    const [manningTable, setManningTable] = useState<any>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (event) {
            fetchEventData();
        }
    }, [event]);

    async function fetchEventData() {
        if (!event) return;
        setLoading(true);
        try {
            const [tableRes, rolesRes] = await Promise.all([
                fetch(`/api/manning-tables?venue_id=${event.venue_id}`),
                fetch('/api/roles')
            ]);

            if (tableRes.ok) {
                const data = await tableRes.json();
                if (data && data.length > 0) {
                    setManningTable(data[0]);
                }
            }
            if (rolesRes.ok) {
                setRoles(await rolesRes.json());
            }
        } catch (e) {
            console.error('Failed to fetch event detail data', e);
        } finally {
            setLoading(false);
        }
    }

    if (!event) return null;

    const venue = venues.find(v => v.id === event.venue_id);

    const getReqsSummary = (reqsString?: string) => {
        try {
            if (!reqsString || !reqsString.startsWith('[')) return [];
            return JSON.parse(reqsString);
        } catch (e) { return []; }
    };

    const specialReqs = getReqsSummary(event.special_requirements);

    const formatTimeDisplay = (timeStr?: string) => {
        if (!timeStr) return 'TBD';
        const [h, m] = timeStr.split(':');
        const d = new Date();
        d.setHours(Number(h));
        d.setMinutes(Number(m));
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    // Bracket logic
    const getActiveBracketIndex = () => {
        if (!manningTable || !manningTable.config || !manningTable.config.brackets) return -1;

        return manningTable.config.brackets.findIndex((bracket: string) => {
            const [min, max] = bracket.split('-').map(Number);
            return event.guest_count >= min && event.guest_count <= max;
        });
    };

    const activeBracketIndex = getActiveBracketIndex();
    const activeBracketLabel = activeBracketIndex !== -1 ? manningTable.config.brackets[activeBracketIndex] : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-header-title">
                        <span style={{ color: 'var(--primary-color)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Event Details Overview
                        </span>
                        <h3 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700 }}>
                            {event.event_name || 'Untitled Event'}
                        </h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
                    {/* Basic Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <MapPin size={16} /> Venue
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{venue?.name || 'Unknown'}</div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Calendar size={16} /> Date
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Clock size={16} /> Time
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {formatTimeDisplay(event.start_time)} — {formatTimeDisplay(event.end_time)}
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                <Users size={16} /> Attendance
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                {event.guest_count} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>PAX</span>
                            </div>
                        </div>
                    </div>

                    {/* Special Requirements */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                            <Zap size={18} style={{ color: 'var(--primary-color)' }} /> Special Requirements
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {specialReqs.length > 0 ? (
                                specialReqs.map((req: any, idx: number) => (
                                    <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{req.quantity}x</span>
                                        <span style={{ fontWeight: 600 }}>{req.skill}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>No special requirements specified.</div>
                            )}
                        </div>
                    </div>

                    {/* Venue Staffing Rules Table */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                                    <Briefcase size={18} style={{ color: 'var(--primary-color)' }} /> Venue Staffing Rules
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Based on {venue?.name} configuration</p>
                            </div>
                            {activeBracketLabel && (
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', background: 'rgba(124, 76, 44, 0.08)', padding: '4px 10px', borderRadius: '6px' }}>
                                    Targeting: {activeBracketLabel} PAX Bracket
                                </div>
                            )}
                        </div>

                        {!manningTable ? (
                            <div style={{ padding: '2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.9rem' }}>
                                {loading ? 'Fetching staffing rules...' : 'No staffing rules configured for this venue.'}
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc' }}>
                                            <th style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: '#64748b', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1, width: '150px' }}>ROLE</th>
                                            {manningTable.config.brackets.map((bracket: string, idx: number) => (
                                                <th
                                                    key={idx}
                                                    style={{
                                                        padding: '1rem',
                                                        borderBottom: '1px solid #e2e8f0',
                                                        textAlign: 'center',
                                                        fontWeight: 800,
                                                        color: '#64748b',
                                                        background: idx === activeBracketIndex ? 'rgba(124, 76, 44, 0.08)' : 'transparent',
                                                        borderLeft: idx === activeBracketIndex ? '2px solid var(--primary-color)' : 'none',
                                                        borderRight: idx === activeBracketIndex ? '2px solid var(--primary-color)' : 'none'
                                                    }}
                                                >
                                                    {bracket}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manningTable.config.rows.map((row: any, ri: number) => (
                                            <tr key={ri} style={{ borderBottom: ri === manningTable.config.rows.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem', fontWeight: 700, color: '#1e293b', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>{row.role}</td>
                                                {row.counts.map((count: number, ci: number) => (
                                                    <td
                                                        key={ci}
                                                        style={{
                                                            padding: '1rem',
                                                            textAlign: 'center',
                                                            fontWeight: ci === activeBracketIndex ? 700 : 500,
                                                            color: ci === activeBracketIndex ? 'var(--primary-color)' : '#64748b',
                                                            background: ci === activeBracketIndex ? 'rgba(124, 76, 44, 0.04)' : 'transparent',
                                                            borderLeft: ci === activeBracketIndex ? '2px solid var(--primary-color)' : 'none',
                                                            borderRight: ci === activeBracketIndex ? '2px solid var(--primary-color)' : 'none'
                                                        }}
                                                    >
                                                        {count}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ padding: '1.25rem 2rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className={styles.buttonSecondary} onClick={onClose} style={{ padding: '0.75rem 1.5rem', minWidth: '100px' }}>
                        Close
                    </button>
                    {onEdit && (
                        <button
                            className={styles.buttonPrimary}
                            onClick={() => {
                                onClose();
                                onEdit(event);
                            }}
                            style={{ padding: '0.75rem 1.5rem', minWidth: '120px' }}
                        >
                            Edit Event
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
