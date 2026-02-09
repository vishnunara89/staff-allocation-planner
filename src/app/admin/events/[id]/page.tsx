"use client";

import { useState } from "react";
import {
    Calendar,
    Users,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    Zap,
    Download,
    Share2,
    MessageSquare
} from "lucide-react";
import styles from "./events.module.css";
import Link from "next/link";

export default function AdminEventDetailPage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState<'Staffing' | 'Assignments' | 'Communication'>('Staffing');

    return (
        <div className={styles.container}>
            <Link href="/admin/events" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Back to Events
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{ padding: '4px 10px', background: 'rgba(124, 76, 44, 0.1)', color: 'var(--primary-color)', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>SONARA</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                            <Calendar size={14} /> Feb 15, 2026 • 18:00
                        </div>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, margin: 0 }}>Luxury Desert Wedding</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{ height: '48px', padding: '0 1.5rem', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <Share2 size={18} /> Share Plan
                    </button>
                    <button style={{ height: '48px', padding: '0 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(124, 76, 44, 0.2)' }}>
                        <Zap size={18} /> Smart Assign
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2.5rem', marginTop: '1rem' }}>
                <div>
                    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '2rem' }}>
                            {['Staffing', 'Assignments', 'Communication'].map((tab: any) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{ background: 'none', border: 'none', padding: '0.75rem 0', fontSize: '0.9rem', fontWeight: 700, color: activeTab === tab ? 'var(--primary-color)' : '#94a3b8', borderBottom: activeTab === tab ? '2px solid var(--primary-color)' : '2px solid transparent', cursor: 'pointer' }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Staffing Requirements</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <span style={{ color: '#ef4444' }}>12 Gaps Found</span>
                                    <span style={{ color: '#22c55e' }}>8 Assigned</span>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1.5px solid #f8fafc' }}>
                                        <th style={{ padding: '1rem 0', color: '#94a3b8', fontSize: '0.75rem' }}>ROLE</th>
                                        <th style={{ padding: '1rem 0', color: '#94a3b8', fontSize: '0.75rem' }}>REQUIRED</th>
                                        <th style={{ padding: '1rem 0', color: '#94a3b8', fontSize: '0.75rem' }}>ASSIGNED</th>
                                        <th style={{ padding: '1rem 0', color: '#94a3b8', fontSize: '0.75rem' }}>STATUS</th>
                                        <th style={{ padding: '1rem 0' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { role: 'Event Manager', req: 1, ass: 1, status: 'Full' },
                                        { role: 'Waiter', req: 10, ass: 4, status: 'Critical' },
                                        { role: 'Bartender', req: 4, ass: 2, status: 'Warning' },
                                        { role: 'Hostess', req: 2, ass: 1, status: 'Warning' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '1.25rem 0', fontWeight: 700 }}>{row.role}</td>
                                            <td style={{ padding: '1.25rem 0', fontWeight: 600 }}>{row.req}</td>
                                            <td style={{ padding: '1.25rem 0', fontWeight: 600 }}>{row.ass}</td>
                                            <td style={{ padding: '1.25rem 0' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    background: row.status === 'Full' ? '#dcfce7' : row.status === 'Critical' ? '#fee2e2' : '#fef3c7',
                                                    color: row.status === 'Full' ? '#166534' : row.status === 'Critical' ? '#ef4444' : '#92400e'
                                                }}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 0', textAlign: 'right' }}>
                                                <button style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Manage</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ background: '#1a1a1a', color: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Zap size={20} style={{ color: 'var(--primary-color)' }} /> Smart Assignment
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem', lineHeight: 1.5 }}>AI-generated staffing plan based on availability and experience.</p>
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#94a3b8' }}>Efficiency Score</span>
                                <span style={{ color: '#22c55e', fontWeight: 700 }}>94%</span>
                            </div>
                            <div style={{ height: '6px', background: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: '94%', height: '100%', background: 'var(--primary-color)' }}></div>
                            </div>
                            <button style={{ width: '100%', marginTop: '1rem', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
                                Generate Optimized Plan
                            </button>
                        </div>
                    </div>

                    <div style={{ background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '20px', padding: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Plan Quick Actions</h4>
                        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <Download size={16} /> Export PDF Briefing
                            </button>
                            <button style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <MessageSquare size={16} /> Broadcast WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
