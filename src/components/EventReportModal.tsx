"use client";

import { useState, useEffect, useRef } from 'react';
import { Event, Venue, StaffingRule, Role, StaffMember, ManningBracketRow } from '@/types';
import styles from '../app/(manager)/events/events.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface EventReportModalProps {
    event: Event | null;
    onClose: () => void;
    venues: Venue[];
}

interface StaffRequirement {
    roleName: string;
    count: number;
    reasoning: string[];
}

export default function EventReportModal({ event, onClose, venues }: EventReportModalProps) {
    const [rules, setRules] = useState<StaffingRule[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [brackets, setBrackets] = useState<ManningBracketRow[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (event) {
            fetchData();
        }
    }, [event]);

    async function fetchData() {
        setLoading(true);
        try {
            const [rulesData, rolesData, bracketsData, staffData] = await Promise.all([
                fetch('/api/staffing-rules').then(r => r.json()),
                fetch('/api/roles').then(r => r.json()),
                fetch('/api/manning-brackets').then(r => r.json()),
                fetch('/api/staff').then(r => r.json())
            ]);
            setRules(rulesData);
            setRoles(rolesData);
            setBrackets(bracketsData.map((b: any) => ({ ...b, counts: JSON.parse(b.counts_json) })));
            setStaff(staffData.map((s: any) => ({
                ...s,
                special_skills: s.special_skills ? JSON.parse(s.special_skills) : [],
                other_languages: s.other_languages ? JSON.parse(s.other_languages) : {}
            })));
        } catch (e) {
            console.error('Failed to fetch report data', e);
        } finally {
            setLoading(false);
        }
    }

    if (!event) return null;

    const venue = venues.find(v => v.id === event.venue_id);

    // Calculation Logic (Simplified version of lib/engine.ts)
    const calculateRequirements = () => {
        const reqs: StaffRequirement[] = [];
        const venueRules = rules.filter(r => r.venue_id === event.venue_id);
        const venueBrackets = brackets.filter(b => b.venue_id === event.venue_id);
        const departments = new Set<string>();
        venueRules.forEach(r => departments.add(r.department.toLowerCase()));
        venueBrackets.forEach(b => departments.add(b.department.toLowerCase()));

        departments.forEach(dept => {
            let applied = false;
            // Brackets
            const deptBrackets = venueBrackets.filter(b => b.department.toLowerCase() === dept);
            if (deptBrackets.length > 0) {
                const match = deptBrackets.find(b => event.guest_count >= b.guest_min && event.guest_count <= b.guest_max);
                if (match) {
                    Object.entries(match.counts).forEach(([roleId, count]) => {
                        const role = roles.find(r => r.id === Number(roleId));
                        if (role && Number(count) > 0) {
                            reqs.push({
                                roleName: role.name,
                                count: Number(count),
                                reasoning: [`Matched Bracket: ${match.guest_min}-${match.guest_max} guests`]
                            });
                        }
                    });
                    applied = true;
                }
            }

            // Ratio Rules
            if (!applied) {
                const deptRules = venueRules.filter(r => r.department.toLowerCase() === dept);
                deptRules.forEach(rule => {
                    const role = roles.find(r => r.id === rule.role_id);
                    if (!role) return;

                    let count = 0;
                    const reasons = [];
                    if (rule.ratio_guests > 0 && rule.ratio_staff > 0) {
                        const ratioCount = Math.ceil(event.guest_count / rule.ratio_guests) * rule.ratio_staff;
                        count += ratioCount;
                        reasons.push(`Ratio: 1 staff per ${rule.ratio_guests} guests`);
                    }
                    if (rule.threshold_guests && event.guest_count >= rule.threshold_guests) {
                        count += rule.threshold_staff || 0;
                        reasons.push(`Threshold: >${rule.threshold_guests} guests (+${rule.threshold_staff})`);
                    }
                    if (rule.min_required && count < rule.min_required) {
                        count = rule.min_required;
                        reasons.push(`Minimum set to ${rule.min_required}`);
                    }

                    if (count > 0) {
                        reqs.push({ roleName: role.name, count, reasoning: reasons });
                    }
                });
            }
        });

        return reqs;
    };

    const requirements = calculateRequirements();
    const totalNeeded = requirements.reduce((sum, r) => sum + r.count, 0);

    const getSpecialRequirements = () => {
        try {
            if (!event.special_requirements || !event.special_requirements.startsWith('[')) return [];
            return JSON.parse(event.special_requirements);
        } catch (e) { return []; }
    };
    const specialReqs = getSpecialRequirements();

    // Matching logic
    const findMatches = (req: any) => {
        return staff.filter(s => {
            if (req.type === 'skill') {
                return s.special_skills.includes(req.value);
            }
            if (req.type === 'language') {
                if (req.value.toLowerCase() === 'english') return s.english_proficiency === 'fluent' || s.english_proficiency === 'good';
                return Object.keys(s.other_languages).some(l => l.toLowerCase() === req.value.toLowerCase());
            }
            return false;
        }).slice(0, 5); // Just show top 5
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('report-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`EventReport_${event.id}_${event.venue_id}.pdf`);
        } catch (err) {
            console.error("Failed to generate PDF", err);
            alert("Could not generate PDF. Please try again.");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                <div className="modal-header">
                    <div className="modal-header-title">
                        <span style={{ color: '#7C4C2C', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Event Analysis</span>
                        <h3 style={{ marginTop: '0.1rem', fontSize: '1.5rem' }}>Staffing Report</h3>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body" style={{ padding: '0 2rem 2rem' }}>
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Generating detailed report...</div>
                    ) : (
                        <div id="report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
                            {/* Summary Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, #7C4C2C 0%, #4a2e1a 100%)',
                                padding: '1.25rem',
                                borderRadius: '16px',
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Venue</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{venue?.name}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                        {new Date(event.date).toLocaleDateString()} <br />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>{event.start_time} - {event.end_time}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guests</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{event.guest_count}</div>
                                </div>
                                <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Needed</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalNeeded}</div>
                                </div>
                            </div>

                            {/* Requirements Table */}
                            <div>
                                <h4 style={{ fontSize: '0.9rem', color: '#1a1a1a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                    <span style={{ fontSize: '1rem' }}>📋</span> Baseline Requirements
                                </h4>
                                <div style={{ background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'rgba(124, 76, 44, 0.05)' }}>
                                            <tr>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                                                <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Count</th>
                                                <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calculation Rule</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {requirements.map((req, i) => (
                                                <tr key={i} style={{ borderTop: '1px solid #e2e8f0' }}>
                                                    <td style={{ padding: '0.75rem', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{req.roleName}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                        <span style={{ background: '#EFE8E3', color: '#7C4C2C', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>{req.count}</span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                                                        {req.reasoning.join(', ')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Special Requirements */}
                            {specialReqs.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', color: '#1a1a1a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                                        <span style={{ fontSize: '1rem' }}>✨</span> Additional Special Requirements
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        {specialReqs.map((req: any, i: number) => {
                                            const matches = findMatches(req);
                                            return (
                                                <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontWeight: 600 }}>{req.quantity}x {req.value}</span>
                                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{req.type}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                        {matches.length > 0 ? (
                                                            <>
                                                                Matching staff: {matches.map(m => m.full_name).join(', ')}
                                                                {matches.length === 5 && '...'}
                                                            </>
                                                        ) : (
                                                            'No specific matches found in roster'
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!specialReqs.length && (
                                <div style={{ border: '1px dashed #e2e8f0', padding: '1.5rem', textAlign: 'center', borderRadius: '12px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                    No special requirements added for this event.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" className={styles.buttonCancel} onClick={onClose}>Close</button>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            className={styles.buttonSecondary}
                            onClick={handleDownloadPDF}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <span>📥</span> Download PDF
                        </button>
                        <button
                            className={styles.buttonSubmit}
                            onClick={() => {
                                onClose();
                            }}
                        >
                            Generate All Plans
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
