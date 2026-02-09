"use client";

import { Phone, MessageCircle } from "lucide-react";
import styles from "./admin-employee-card.module.css";

interface AdminEmployeeCardProps {
    employee: {
        id: string | number;
        name: string;
        role: string;
        phone: string;
        status: 'available' | 'working' | 'off' | 'leave' | string;
    };
}

export default function AdminEmployeeCard({ employee }: AdminEmployeeCardProps) {
    const safeStatus = (employee.status || 'available').toLowerCase();
    const statusClass = styles[`status-${safeStatus.replace(' ', '-')}`] || '';
    const safePhone = employee.phone || '';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.info}>
                    <h4 className={styles.name}>{employee.name}</h4>
                    <span className={styles.role}>{employee.role}</span>
                </div>
                <span className={`${styles.status} ${statusClass}`} style={{ textTransform: 'capitalize' }}>
                    {employee.status || 'Available'}
                </span>
            </div>

            <div className={styles.contact}>
                <Phone size={14} />
                <span>{safePhone || 'No phone'}</span>
            </div>

            <div className={styles.actions}>
                <a
                    href={safePhone ? `https://wa.me/${safePhone.replace(/\D/g, '')}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.whatsapp} ${!safePhone ? styles.disabled : ''}`}
                >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                </a>
                <a
                    href={safePhone ? `tel:${safePhone}` : '#'}
                    className={`${styles.actionBtn} ${styles.call} ${!safePhone ? styles.disabled : ''}`}
                >
                    <Phone size={16} />
                    <span>Call</span>
                </a>
            </div>

        </div>
    );
}
