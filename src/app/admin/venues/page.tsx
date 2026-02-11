"use client";

import { useState, useEffect } from "react";
import {
    MapPin,
    Users,
    Settings,
    Plus,
    ArrowRight,
    Search,
    MoreVertical,
    Trash2,
    X,
    Building2,
    Loader2
} from "lucide-react";
import styles from "./venues.module.css";
import Link from "next/link";
import VenueModal from "@/components/VenueModal";

interface Venue {
    id: number;
    name: string;
    type: string;
    notes: string;
}

interface Rule {
    id: number;
    venue_id: number;
}

export default function AdminVenuesPage() {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [ruleCounts, setRuleCounts] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchVenues();
    }, []);

    async function fetchVenues() {
        setLoading(true);
        try {
            const [venuesRes, rulesRes] = await Promise.all([
                fetch('/api/venues'),
                fetch('/api/rules')
            ]);

            const venuesJson = await venuesRes.json().catch(() => []);
            const rulesJson = await rulesRes.json().catch(() => []);

            const venuesData = Array.isArray(venuesJson) ? venuesJson : [];
            const rulesData = Array.isArray(rulesJson) ? rulesJson : [];

            // Calculate rule counts per venue
            const counts: Record<number, number> = {};
            rulesData.forEach((rule: Rule) => {
                counts[rule.venue_id] = (counts[rule.venue_id] || 0) + 1;
            });

            setVenues(venuesData);
            setRuleCounts(counts);
        } catch (error) {
            console.error("Failed to fetch venues data:", error);
            setVenues([]);
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm("Are you sure you want to delete this venue? This will also remove associated staffing rules.")) return;

        try {
            const res = await fetch(`/api/venues/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setVenues(venues.filter(v => v.id !== id));
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const filteredVenues = venues.filter(v =>
        v.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        v.type?.toLowerCase()?.includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Venues & Camps</h2>
                    <p>Global management of all physical locations and operational rules.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{ background: 'var(--primary-color)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}
                >
                    <Plus size={20} /> Add New Venue
                </button>
            </header>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                    <Search size={22} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search venues..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', height: '52px', padding: '0 1rem 0 3.5rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', fontSize: '1rem' }}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading venues...</p>
                </div>
            ) : filteredVenues.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                    <Building2 size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
                    <h3>No Venues Found</h3>
                    <p style={{ color: '#64748b' }}>Create a venue to start defining staffing rules.</p>
                </div>
            ) : (
                <div className={styles.venueGrid}>
                    {filteredVenues.map((venue) => (
                        <div key={venue.id} className={styles.venueItem}>
                            <Link href={`/admin/venues/${venue.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                                <div className={styles.venueCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.venueTitle}>
                                            <span className={styles.venueType}>{venue.type}</span>
                                            <h3>{venue.name}</h3>
                                        </div>
                                    </div>

                                    <p className={styles.venueNotes}>{venue.notes || "No additional notes provided."}</p>

                                    <div className={styles.cardMetrics}>
                                        <div className={styles.metric}>
                                            <div className={styles.metricValue}>
                                                <Users size={20} /> —
                                            </div>
                                            <span className={styles.metricLabel}>Managers</span>
                                        </div>
                                        <div className={styles.metric}>
                                            <div className={styles.metricValue}>
                                                <Settings size={20} /> {ruleCounts[venue.id] || 0}
                                            </div>
                                            <span className={styles.metricLabel}>Rules</span>
                                        </div>
                                    </div>

                                    <div className={styles.venueFooter}>
                                        <div className={styles.viewDetail}>
                                            Manage <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                            <button
                                className={styles.deleteBtn}
                                onClick={(e) => handleDelete(venue.id, e)}
                                title="Delete Venue"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <VenueModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    fetchVenues();
                    setShowModal(false);
                }}
            />
        </div>
    );
}
