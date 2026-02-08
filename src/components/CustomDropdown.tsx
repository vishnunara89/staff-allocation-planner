"use client";

import { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './dropdown.module.css';

interface Option {
    id: string | number;
    name: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    icon?: ReactNode;
    size?: 'small' | 'medium';
    className?: string;
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder,
    icon,
    size = 'medium',
    className = ''
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => String(opt.id) === String(value));
    const displayValue = selectedOption ? selectedOption.name : placeholder;

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

    return (
        <div
            className={`${styles.dropdownContainer} ${styles[size]} ${className}`}
            ref={dropdownRef}
        >
            <div
                className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                    {icon && <span className={styles.iconPrefix}>{icon}</span>}
                    <span className={styles.label}>{displayValue}</span>
                </div>
                <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    {placeholder && !value && (
                        <div
                            className={`${styles.option} ${styles.optionSelected}`}
                            onClick={() => {
                                onChange('');
                                setIsOpen(false);
                            }}
                        >
                            {placeholder}
                        </div>
                    )}
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={`${styles.option} ${String(option.id) === String(value) ? styles.optionSelected : ''}`}
                            onClick={() => {
                                onChange(String(option.id));
                                setIsOpen(false);
                            }}
                        >
                            {option.name}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className={styles.option} style={{ opacity: 0.5, cursor: 'default' }}>
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
