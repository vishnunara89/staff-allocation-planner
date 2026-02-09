"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Search,
    ChevronRight,
    Users,
    Loader2
} from "lucide-react";
import styles from "./plans.module.css";
import Link from "next/link";
import CustomDropdown from "@/components/CustomDropdown";
import { Venue } from "@/types";

interface PlanSummary {
    event_date: string;
    venue_id: number;
    status: string;
    staff_count: number;
}

export default function AdminPlansPage() {
    const [plans, setPlans] = useState<PlanSummary[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [filterVenue, setFilterVenue] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [plansRes, venuesRes] = await Promise.all([
                fetch('/api/plans'),
                fetch('/api/venues')
            ]);

            setPlans(await plansRes.json());
            setVenues(await venuesRes.json());
        } catch (error) {
            console.error("Failed to fetch plans data:", error);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || `ID: ${id}`;

    const filteredPlans = plans.filter(plan => {
        const venueName = getVenueName(plan.venue_id).toLowerCase();
        const matchesSearch = venueName.includes(searchQuery.toLowerCase()) || plan.event_date.includes(searchQuery);
        const matchesVenue = !filterVenue || plan.venue_id === Number(filterVenue);
        const matchesStatus = !filterStatus || plan.status === filterStatus;
        return matchesSearch && matchesVenue && matchesStatus;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Staffing Plans</h2>
                    <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Overview of all finalized and draft staffing plans.</p>
                </div>
                <button
                    onClick={() => alert("CSV Export is scheduled for Phase 5.")}
                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                    <Download size={18} /> Export All (CSV)
                </button>
            </header>

            <div style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <CustomDropdown
                        options={venues}
                        value={filterVenue}
                        onChange={setFilterVenue}
                        placeholder="All Venues"
                    />
                    <CustomDropdown
                        options={[
                            { id: 'confirmed', name: 'Confirmed' },
                            { id: 'draft', name: 'Draft' }
                        ]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="All Statuses"
                    />
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by venue or date..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', height: '44px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <Loader2 size={40} className="animate-spin" style={{ color: 'var(--primary-color)', margin: '0 auto' }} />
                </div>
            ) : (
                <div className={styles.plansTableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>VENUE</th>
                                <th>DATE</th>
                                <th>TOTAL STAFF</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.map((plan, idx) => (
                                <tr key={`${plan.venue_id}-${plan.event_date}-${idx}`}>
                                    <td>
                                        <div style={{ fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 800 }}>{getVenueName(plan.venue_id)}</div>
                                    </td>
                                    <td>{plan.event_date}</td>
                                    <td style={{ fontWeight: 700 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={16} style={{ color: '#94a3b8' }} /> {plan.staff_count} Assigned
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            background: plan.status === 'confirmed' ? '#dcfce7' : '#f1f5f9',
                                            color: plan.status === 'confirmed' ? '#166534' : '#475569',
                                            textTransform: 'capitalize'
                                        }}>
                                            {plan.status}
                                        </span>
                                    </td>
                                    <td>
                                        <Link href={`/dashboard?date=${plan.event_date}`} style={{ textDecoration: 'none' }}>
                                            <button style={{ background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <FileText size={14} /> View Details
                                            </button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredPlans.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No staffing plans found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
