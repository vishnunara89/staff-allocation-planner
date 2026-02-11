"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  UserPlus,
  ClipboardList,
  MapPin,
  X,
  Phone,
  User,
  Search,
  Trash2, // Added Trash2
} from "lucide-react";
import styles from "./managers.module.css";
import { Venue } from "@/types";

/* =====================
   TYPES
===================== */
type Manager = {
  id: number;
  name: string;
  phone: string;
  username: string;
  venues: string[];
  venueIds: number[];
  venueCount: number; // ✅ IMPORTANT
};

export default function ManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add manager
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Assign venues
  const [assignMgr, setAssignMgr] = useState<Manager | null>(null);
  const [selectedVenueIds, setSelectedVenueIds] = useState<number[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  /* =====================
     LOAD DATA
  ===================== */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [mgrRes, venRes] = await Promise.all([
        fetch("/api/managers", { cache: "no-store" }),
        fetch("/api/venues"),
      ]);

      const mgrData = await mgrRes.json();
      const venData = await venRes.json();

      if (!mgrRes.ok) throw new Error(mgrData?.error || "Failed to load managers");

      setManagers(Array.isArray(mgrData) ? mgrData : []);
      setVenues(Array.isArray(venData) ? venData : []);
    } catch (err: any) {
      setError(err.message || "Server error");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =====================
     ADD MANAGER
  ===================== */
  const addManager = async () => {
    if (!name || !phone || !username || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");

      setShowAdd(false);
      setName("");
      setPhone("");
      setUsername("");
      setPassword("");

      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================
     DELETE MANAGER
  ===================== */
  const deleteManager = async (id: number) => {
    if (!confirm("Are you sure you want to delete this manager? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/managers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: id }),
      });

      if (res.ok) {
        // Optimistic UI update
        setManagers((prev) => prev.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete manager");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred while deleting the manager.");
    }
  };

  /* =====================
     ASSIGN VENUES (FIXED)
  ===================== */
  const saveAssignment = async () => {
    if (!assignMgr) return;

    try {
      await fetch("/api/managers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId: assignMgr.id,
          venueIds: selectedVenueIds,
        }),
      });

      // ✅ INSTANT UI UPDATE
      setManagers((prev) =>
        prev.map((m) =>
          m.id === assignMgr.id
            ? {
              ...m,
              venueIds: selectedVenueIds,
              venues: venues
                .filter((v) => selectedVenueIds.includes(v.id))
                .map((v) => v.name),
              venueCount: selectedVenueIds.length,
            }
            : m
        )
      );

      setAssignMgr(null);
      setSelectedVenueIds([]);

      loadData(); // ✅ keep DB truth
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  /* =====================
     UI
  ===================== */
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Manage Managers</h2>
          <p>Create managers and assign venues</p>
        </div>

        <button className={styles.primaryBtn} onClick={() => setShowAdd(true)}>
          <UserPlus size={16} /> Add Manager
        </button>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.muted}>Loading managers…</p>
      ) : managers.length === 0 ? (
        <p className={styles.muted}>No managers found</p>
      ) : (
        <div className={styles.grid}>
          {managers
            .filter(
              (m) =>
                !searchQuery ||
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.username.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((m) => (
              <div key={m.id} className={styles.managerCard} style={{ position: "relative" }}>
                {/* Delete Button */}
                <button
                  onClick={() => deleteManager(m.id)}
                  style={{
                    position: "absolute",
                    top: "1.25rem",
                    right: "1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#cbd5e1",
                    transition: "color 0.2s",
                  }}
                  title="Delete Manager"
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                >
                  <Trash2 size={18} />
                </button>

                <div className={styles.iconCircle}>
                  <Shield size={20} />
                </div>

                <h4>{m.name}</h4>

                <div className={styles.detail}>
                  <User size={14} /> {m.username}
                </div>

                <div className={styles.detail}>
                  <Phone size={14} /> {m.phone}
                </div>

                <div className={styles.role}>Role: Manager</div>

                <div className={styles.venueList}>
                  {m.venues.length === 0 ? (
                    <span className={styles.muted}>No venues assigned</span>
                  ) : (
                    m.venues.map((v) => (
                      <span key={v} className={styles.badge}>
                        <MapPin size={12} /> {v}
                      </span>
                    ))
                  )}
                </div>

                <div className={styles.count}>
                  Total Venues: <b>{m.venueCount}</b>
                </div>

                <button
                  className={styles.assignBtn}
                  onClick={() => {
                    setAssignMgr(m);
                    setSelectedVenueIds(m.venueIds);
                  }}
                >
                  <ClipboardList size={14} /> Assign Venues
                </button>
              </div>
            ))}
        </div>
      )}

      {/* ADD MANAGER MODAL (RESTORED) */}
      {showAdd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Add New Manager</h3>
            <p>Create a login for a new manager.</p>

            <input
              className={styles.input} // Ensure this follows CSS or inline if needed
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={!styles.input ? { width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' } : {}}
            />
            <input
              className={styles.input}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={!styles.input ? { width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' } : {}}
            />
            <input
              className={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={!styles.input ? { width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' } : {}}
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={!styles.input ? { width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' } : {}}
            />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.modalActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setShowAdd(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={addManager}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Manager"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assignMgr && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Assign Venues to {assignMgr.name}</h3>

            <div className={styles.checkboxGrid}>
              {venues.map((v) => (
                <label key={v.id} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedVenueIds.includes(v.id)}
                    onChange={(e) =>
                      setSelectedVenueIds((prev) =>
                        e.target.checked
                          ? [...prev, v.id]
                          : prev.filter((id) => id !== v.id)
                      )
                    }
                  />
                  {v.name}
                </label>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.secondaryBtn}
                onClick={() => setAssignMgr(null)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryBtn}
                onClick={saveAssignment}
              >
                Save Assignment ({selectedVenueIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
