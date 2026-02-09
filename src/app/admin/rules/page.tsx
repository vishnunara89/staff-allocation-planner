"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Search,
    FileUp,
    Loader2
} from "lucide-react";
import styles from "../venues/venues.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import { StaffingRule, Venue, Role } from "@/types";

export default function GlobalRulesPage() {
    const [rules, setRules] = useState<StaffingRule[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Filters
    const [filterVenue, setFilterVenue] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterRole, setFilterRole] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [rulesRes, venuesRes, rolesRes] = await Promise.all([
                fetch('/api/rules'),
                fetch('/api/venues'),
                fetch('/api/roles')
            ]);

            setRules(await rulesRes.json());
            setVenues(await venuesRes.json());
            setRoles(await rolesRes.json());
        } catch (error) {
            console.error("Failed to fetch rules data:", error);
        } finally {
            setLoading(false);
        }
    }

    const getVenueName = (id: number) => venues.find(v => v.id === id)?.name || `ID: ${id}`;
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || `ID: ${id}`;

    const filteredRules = rules.filter(rule => {
        const venueName = getVenueName(rule.venue_id).toLowerCase();
        const roleName = getRoleName(rule.role_id).toLowerCase();
        const deptName = (rule.department || "").toLowerCase();

        const matchesSearch = venueName.includes(searchQuery.toLowerCase()) ||
            roleName.includes(searchQuery.toLowerCase()) ||
            deptName.includes(searchQuery.toLowerCase());

        const matchesVenue = !filterVenue || rule.venue_id === Number(filterVenue);
        const matchesDept = !filterDept || rule.department === filterDept;
        const matchesRole = !filterRole || rule.role_id === Number(filterRole);

        return matchesSearch && matchesVenue && matchesDept && matchesRole;
    });

    const departments = Array.from(new Set(rules.map(r => r.department).filter(Boolean)));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerText}>
                    <h2>Manning Rules</h2>
                    <p>Global configuration for automated staffing logic.</p>
                </div>
                <button
                    className={styles.buttonSecondary}
                    onClick={() => alert("Excel Import functionality is coming soon in the next phase.")}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                    <FileUp size={18} /> Import Excel
                </button>
            </header>

            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ width: '100%', height: '48px', padding: '0 1rem 0 3rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none' }}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <CustomDropdown
                        options={venues}
                        value={filterVenue}
                        onChange={setFilterVenue}
                        placeholder="All Venues"
                    />
                    <CustomDropdown
                        options={departments.map(d => ({ id: d, name: d }))}
                        value={filterDept}
                        onChange={setFilterDept}
                        placeholder="All Departments"
                    />
                    <CustomDropdown
                        options={roles}
                        value={filterRole}
                        onChange={setFilterRole}
                        placeholder="All Roles"
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                    <p>Loading rules...</p>
                </div>
            ) : (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>VENUE</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>DEPARTMENT</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>ROLE</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>RULE CONFIG</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRules.map(rule => (
                                <tr key={rule.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>{getVenueName(rule.venue_id)}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', textTransform: 'capitalize' }}>{rule.department}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 600 }}>{getRoleName(rule.role_id)}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {rule.ratio_guests && (
                                                <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {rule.ratio_staff}:{rule.ratio_guests} PAX
                                                </span>
                                            )}
                                            {(rule.min_required !== undefined && rule.min_required > 0) && (
                                                <span style={{ padding: '2px 8px', background: '#ecfdf5', color: '#065f46', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    MIN: {rule.min_required}
                                                </span>
                                            )}
                                            {rule.max_allowed && (
                                                <span style={{ padding: '2px 8px', background: '#fff1f2', color: '#9f1239', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    MAX: {rule.max_allowed}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRules.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No staffing rules found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
