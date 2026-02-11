import React from 'react';
import { PlanAssignment, EmployeeAvailability } from '@/types';
import styles from '../app/(manager)/plans/plans.module.css';

interface EmployeeCardProps {
    assignment: PlanAssignment;
    onToggleStatus: (status: 'confirmed' | 'pending' | 'declined') => void;
    availability?: EmployeeAvailability;
    phone?: string;
}

export default function EmployeeCard({ assignment, onToggleStatus, availability, phone }: EmployeeCardProps) {
    const isFreelance = assignment.is_freelance;

    // Availability badge config
    const getAvailBadge = () => {
        if (!availability) return null;
        const badges: Record<string, { bg: string; color: string; border: string; label: string }> = {
            available: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: '● Available' },
            limited: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: '◐ Limited' },
            unavailable: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', label: '○ Unavailable' }
        };
        const b = badges[availability.status] || badges.available;
        const label = availability.current_events.length > 0
            ? `Working at ${availability.current_events[0]}`
            : b.label;
        return (
            <span style={{
                display: 'inline-block', fontSize: '0.65rem', padding: '0.1rem 0.5rem',
                borderRadius: '8px', background: b.bg, color: b.color, border: `1px solid ${b.border}`,
                fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{label}</span>
        );
    };

    // Format phone for links
    const cleanPhone = phone?.replace(/[\s-]/g, '') || '';
    const whatsappUrl = cleanPhone
        ? `https://wa.me/${cleanPhone.replace('+', '')}?text=Hi ${encodeURIComponent(assignment.staff_name)}, confirming your shift...`
        : '#';

    return (
        <div className={`${styles.employeeCard} ${isFreelance ? styles.freelanceCard : ''}`}>
            <div className={styles.employeeInfo}>
                <div className={styles.avatar}>
                    {assignment.staff_name.charAt(0)}
                </div>
                <div>
                    <div className={styles.employeeName}>
                        {assignment.staff_name}
                        {isFreelance && <span className={styles.freelanceBadge}>Freelance</span>}
                    </div>
                    <div className={styles.employeeRole}>
                        {assignment.role_name}
                        {availability && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                ({availability.hours_worked}/{12}h)
                            </span>
                        )}
                    </div>
                    {getAvailBadge()}
                </div>
            </div>

            <div className={styles.employeeActions}>
                <button
                    className={`${styles.statusToggle} ${styles[assignment.status]}`}
                    onClick={() => {
                        const nextStatus = assignment.status === 'confirmed' ? 'declined' : 'confirmed';
                        onToggleStatus(nextStatus);
                    }}
                >
                    {assignment.status === 'confirmed' ? 'Confirmed' : 'Unavailable'}
                </button>

                {/* Phone call button */}
                {cleanPhone && (
                    <a
                        href={`tel:${cleanPhone}`}
                        style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: '#EEF2FF', color: '#4F46E5', transition: 'all 0.2s',
                            textDecoration: 'none'
                        }}
                        title="Call"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                        </svg>
                    </a>
                )}

                {/* WhatsApp button */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.whatsappBtn}
                    title="Contact via WhatsApp"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
