"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './status-dropdown.module.css';

interface StatusDropdownProps {
    value: string;
    onChange: (value: string) => void;
}

const STATUS_OPTIONS = [
    { id: 'available', name: 'Available' },
    { id: 'off', name: 'Off' },
    { id: 'leave', name: 'Leave' }
];

export default function StatusDropdown({ value, onChange }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const activeStatus = STATUS_OPTIONS.find(s => s.id === value) || STATUS_OPTIONS[0];

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <div
                className={`${styles.statusBadge} ${styles['status-' + value]}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.statusIndicator}></span>
                <span>{activeStatus.name}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '2px', opacity: 0.7 }}>
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    {STATUS_OPTIONS.map((option) => (
                        <div
                            key={option.id}
                            className={`${styles.option} ${option.id === value ? styles.optionSelected : ''}`}
                            onClick={() => {
                                onChange(option.id);
                                setIsOpen(false);
                            }}
                        >
                            <span className={`${styles.statusIndicator} ${styles['status-' + option.id]}`} style={{ width: '6px', height: '6px' }}></span>
                            {option.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
