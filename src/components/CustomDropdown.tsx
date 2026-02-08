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
}

export default function CustomDropdown({ options, value, onChange, placeholder, icon }: CustomDropdownProps) {
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
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <div
                className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {icon && <span className={styles.iconPrefix}>{icon}</span>}
                <span className={styles.label}>{displayValue}</span>
                <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </div>

            {isOpen && (
                <div className={styles.menu}>
                    <div
                        className={`${styles.option} ${!value ? styles.optionSelected : ''}`}
                        onClick={() => {
                            onChange('');
                            setIsOpen(false);
                        }}
                    >
                        {placeholder}
                    </div>
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
                </div>
            )}
        </div>
    );
}
