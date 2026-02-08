"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './plans.module.css';

interface PlanResult {
    date: string;
    requirements: any[];
    assignments: any[];
    shortages: any[];
    message?: string;
}

export default function PlansPage() {
    const searchParams = useSearchParams();
    const urlDate = searchParams.get('date');

    const [date, setDate] = useState(urlDate || new Date().toISOString().split('T')[0]);
    const [plan, setPlan] = useState<PlanResult | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (urlDate) {
            setDate(urlDate);
        }
    }, [urlDate]);

    async function generatePlan() {
        setLoading(true);
        try {
            const res = await fetch('/api/plans/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date })
            });
            const data = await res.json();
            setPlan(data);
        } catch (err) {
            console.error(err);
            alert('Failed to generate plan');
        } finally {
            setLoading(false);
        }
    }

    async function savePlan() {
        if (!plan) return;
        if (!confirm('Save and confirm this plan? Previous plans for this date will be overwritten.')) return;

        try {
            const res = await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: plan.date,
                    assignments: plan.assignments
                })
            });
            if (res.ok) {
                alert('Plan saved successfully!');
            } else {
                alert('Failed to save plan');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving plan');
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Daily Staffing Plan</h2>
                <div className={styles.controls}>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className={styles.dateInput}
                    />
                    <button onClick={generatePlan} className={styles.buttonPrimary} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Plan'}
                    </button>
                    {plan && (
                        <button onClick={savePlan} className={styles.buttonSecondary} style={{ marginLeft: '1rem' }}>
                            Save Plan
                        </button>
                    )}
                </div>
            </header>

            {plan && (
                <div className={styles.results}>
                    {plan.message && <div className={styles.message}>{plan.message}</div>}

                    {/* Defensive check for error response or missing data */}
                    {!plan.requirements && !plan.message && (
                        <div className="error">Failed to load plan data properly. Please check inputs.</div>
                    )}

                    {(plan.requirements && plan.requirements.length > 0) ? (
                        <>
                            <section className={styles.section}>
                                <h3>Staffing Requirements</h3>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Venue</th>
                                            <th>Role</th>
                                            <th>Count</th>
                                            <th>Reasoning</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.requirements.map((req: any, i: number) => (
                                            <tr key={i}>
                                                <td>{req.venue_name}</td>
                                                <td>{req.role_name}</td>
                                                <td>{req.count}</td>
                                                <td className={styles.reason}>{req.reasoning ? req.reasoning.join(', ') : ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section className={styles.section}>
                                <h3>Assignments</h3>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Venue</th>
                                            <th>Role</th>
                                            <th>Staff</th>
                                            <th>Status</th>
                                            <th>Basis</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plan.assignments && plan.assignments.map((assign: any, i: number) => (
                                            <tr key={i}>
                                                <td>{plan.requirements.find(r => r.venue_id === assign.venue_id)?.venue_name || '-'}</td>
                                                <td>{plan.requirements.find(r => r.role_id === assign.role_id)?.role_name || '-'}</td>
                                                <td>{assign.staff_name}</td>
                                                <td>
                                                    <span className={`${styles.status} ${styles[assign.status]}`}>
                                                        {assign.status}
                                                    </span>
                                                </td>
                                                <td>{assign.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            {plan.shortages && plan.shortages.length > 0 && (
                                <section className={styles.shortageSection}>
                                    <h3>Shortages / External Hires Needed</h3>
                                    <ul>
                                        {plan.shortages.map((s: any, i: number) => (
                                            <li key={i}>
                                                <strong>{s.count}x {s.role_name}</strong> needed at venue {s.venue_id}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </>
                    ) : (
                        plan.message ? null : <div>No requirements generated. Check if venues have staffing rules and events are created.</div>
                    )}
                </div>
            )}
        </div>
    );
}
