"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './time-picker.module.css';

interface PremiumTimePickerProps {
    value: string; // HH:MM (24h format)
    onChange: (value: string) => void;
}

export default function PremiumTimePicker({ value = '12:00', onChange }: PremiumTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Parse value (assumes HH:MM 24h)
    const [h24, m] = value.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 0, 5, 10...

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleUpdate = (newH12: number, newM: number, newPeriod: string) => {
        let finalH24 = newH12;
        if (newPeriod === 'PM' && newH12 < 12) finalH24 += 12;
        if (newPeriod === 'AM' && newH12 === 12) finalH24 = 0;

        const hStr = finalH24.toString().padStart(2, '0');
        const mStr = newM.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    };

    const formatDisplay = () => {
        return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className={styles.timePicker} ref={dropdownRef}>
            <div
                className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.value}>{formatDisplay()}</span>
                <span className={styles.icon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    <div className={styles.column}>
                        <div className={styles.columnLabel}>Hr</div>
                        {hours.map(hr => (
                            <div
                                key={hr}
                                className={`${styles.unit} ${h12 === hr ? styles.unitSelected : ''}`}
                                onClick={() => handleUpdate(hr, m, period)}
                            >
                                {hr.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                    <div className={styles.divider}>:</div>

                    <div className={styles.column}>
                        <div className={styles.columnLabel}>Min</div>
                        {minutes.map(min => (
                            <div
                                key={min}
                                className={`${styles.unit} ${m === min ? styles.unitSelected : ''}`}
                                onClick={() => handleUpdate(h12, min, period)}
                            >
                                {min.toString().padStart(2, '0')}
                            </div>
                        ))}
                    </div>

                    <div className={styles.periodColumn}>
                        <div
                            className={`${styles.period} ${period === 'AM' ? styles.periodSelected : ''}`}
                            onClick={() => handleUpdate(h12, m, 'AM')}
                        >
                            AM
                        </div>
                        <div
                            className={`${styles.period} ${period === 'PM' ? styles.periodSelected : ''}`}
                            onClick={() => handleUpdate(h12, m, 'PM')}
                        >
                            PM
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
