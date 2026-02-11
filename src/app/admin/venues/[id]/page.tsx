"use client";

import { useState, useEffect } from "react";
import {
    MapPin,
    Settings,
    Calendar,
    ArrowLeft,
    Plus,
    Database,
    Loader2,
    Trash2,
    Save,
    Check,
    X,
    ChevronRight,
    ChevronUp,
    ChevronDown
} from "lucide-react";
import styles from "../venues.module.css";
import Link from "next/link";

interface VenueDetailProps {
    params: { id: string };
}

type TabType = "Overview" | "Staffing Rules";

export default function AdminVenueDetailPage({ params }: VenueDetailProps) {

    const [activeTab, setActiveTab] = useState<TabType>("Overview");
    const [venue, setVenue] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [roles, setRoles] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);

    const [newRole, setNewRole] = useState("");
    const [newSkill, setNewSkill] = useState("");

    const DEFAULT_BRACKETS = ["0-10", "10-20", "20-30", "30-40", "40-50"];

    const [manningConfig, setManningConfig] = useState<any>({
        brackets: DEFAULT_BRACKETS,
        rows: []
    });

    const [saving, setSaving] = useState(false);

    /* ==============================
       LOAD DATA
    ============================== */
    useEffect(() => {
        async function load() {
            setLoading(true);

            const [venueRes, rolesRes, skillsRes] = await Promise.all([
                fetch(`/api/venues/${params.id}`),
                fetch(`/api/roles`),
                fetch(`/api/skills`)
            ]);

            if (venueRes.ok) setVenue(await venueRes.json());
            if (rolesRes.ok) setRoles(await rolesRes.json());
            if (skillsRes.ok) setSkills(await skillsRes.json());

            setLoading(false);
        }

        load();
    }, [params.id]);

    /* ==============================
       ADD ROLE
    ============================== */
    const handleAddRole = async () => {
        if (!newRole.trim()) return;

        const res = await fetch("/api/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newRole.trim() })
        });

        if (res.ok) {
            const updated = await fetch("/api/roles");
            setRoles(await updated.json());
            setNewRole("");
        } else {
            alert("Role already exists or failed");
        }
    };

    /* ==============================
       ADD SKILL
    ============================== */
    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;

        const res = await fetch("/api/skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newSkill.trim() })
        });

        if (res.ok) {
            const updated = await fetch("/api/skills");
            setSkills(await updated.json());
            setNewSkill("");
        } else {
            alert("Skill already exists or failed");
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 100, textAlign: "center" }}>
                <Loader2 size={40} className="animate-spin" />
            </div>
        );
    }

    return (
        <div className={styles.container}>

            <div style={{ marginBottom: 20 }}>
                <Link href="/admin/venues">
                    <ArrowLeft size={16} /> Back to Venues
                </Link>
            </div>

            <h1 style={{ fontSize: 28, marginBottom: 20 }}>{venue?.name}</h1>

            {/* ===============================
               ROLE + SKILL MANAGEMENT UI
            =============================== */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "2rem",
                marginBottom: "2rem"
            }}>
                {/* ADD ROLE */}
                <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>
                    <h3>Add New Role</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                        <input
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            placeholder="Enter role name"
                            style={{ flex: 1 }}
                        />
                        <button onClick={handleAddRole}>
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>

                {/* ADD SKILL */}
                <div style={{ background: "#fff", padding: 20, borderRadius: 12 }}>
                    <h3>Add New Skill</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                        <input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Enter skill name"
                            style={{ flex: 1 }}
                        />
                        <button onClick={handleAddSkill}>
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>
            </div>

            {/* ===============================
               STAFFING RULES TABLE
            =============================== */}
            <div className={styles.excelGridContainer}>
                <table className={styles.excelGrid}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>Role</th>
                            <th>Skill</th>
                            {manningConfig.brackets.map((b: string, i: number) => (
                                <th key={i}>{b}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {manningConfig.rows.map((row: any, rowIdx: number) => (
                            <tr key={rowIdx}>
                                <td>
                                    <button
                                        onClick={() => {
                                            const updated = { ...manningConfig };
                                            updated.rows.splice(rowIdx, 1);
                                            setManningConfig(updated);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>

                                <td>
                                    <select
                                        value={row.role}
                                        onChange={(e) => {
                                            const updated = { ...manningConfig };
                                            updated.rows[rowIdx].role = e.target.value;
                                            setManningConfig(updated);
                                        }}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.name}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <select
                                        value={row.skill}
                                        onChange={(e) => {
                                            const updated = { ...manningConfig };
                                            updated.rows[rowIdx].skill = e.target.value;
                                            setManningConfig(updated);
                                        }}
                                    >
                                        <option value="">Select Skill</option>
                                        {skills.map(s => (
                                            <option key={s.id} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                {row.counts.map((count: number, colIdx: number) => (
                                    <td key={colIdx}>
                                        <input
                                            type="number"
                                            value={count}
                                            onChange={(e) => {
                                                const updated = { ...manningConfig };
                                                updated.rows[rowIdx].counts[colIdx] =
                                                    parseInt(e.target.value) || 0;
                                                setManningConfig(updated);
                                            }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 20 }}>
                <button
                    onClick={() => {
                        const updated = { ...manningConfig };
                        updated.rows.push({
                            role: "",
                            skill: "",
                            counts: new Array(updated.brackets.length).fill(0)
                        });
                        setManningConfig(updated);
                    }}
                >
                    + Add Row
                </button>
            </div>
        </div>
    );
}
