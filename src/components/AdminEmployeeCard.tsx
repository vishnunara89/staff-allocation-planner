"use client";

import { Phone, MessageCircle } from "lucide-react";
import styles from "./admin-employee-card.module.css";

interface AdminEmployeeCardProps {
    employee: {
        id: string | number;
        name: string;
        role: string;
        phone: string;
        status: 'Available' | 'Working' | 'On Leave' | 'Off Duty';
    };
}

export default function AdminEmployeeCard({ employee }: AdminEmployeeCardProps) {
    const statusClass = styles[`status-${employee.status.toLowerCase().replace(' ', '-')}`];

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.info}>
                    <h4 className={styles.name}>{employee.name}</h4>
                    <span className={styles.role}>{employee.role}</span>
                </div>
                <span className={`${styles.status} ${statusClass}`}>
                    {employee.status}
                </span>
            </div>

            <div className={styles.contact}>
                <Phone size={14} />
                <span>{employee.phone}</span>
            </div>

            <div className={styles.actions}>
                <a
                    href={`https://wa.me/${employee.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.whatsapp}`}
                >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                </a>
                <a
                    href={`tel:${employee.phone}`}
                    className={`${styles.actionBtn} ${styles.call}`}
                >
                    <Phone size={16} />
                    <span>Call</span>
                </a>
            </div>
        </div>
    );
}
