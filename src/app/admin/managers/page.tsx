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
} from "lucide-react";
import styles from "./managers.module.css";

/* =====================
   TYPES
===================== */
type Manager = {
  id: number;
  name: string;
  phone: string;
  username: string;
  venues: string[];
};

const venuesList = ["SONARA", "NEST", "LADY NARA", "RAMADAN CAMP"];

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
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);

  /* =====================
     LOAD MANAGERS
  ===================== */
  const loadManagers = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/managers", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to load managers");

      setManagers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Server error");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagers();
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

      await loadManagers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* =====================
     ASSIGN VENUES
  ===================== */
  const saveAssignment = async () => {
    if (!assignMgr) return;

    await fetch("/api/managers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        managerId: assignMgr.id,
        venues: selectedVenues,
      }),
    });

    setAssignMgr(null);
    setSelectedVenues([]);
    loadManagers();
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
          {managers.map((m) => (
            <div key={m.id} className={styles.managerCard}>
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
                Total Venues: <b>{m.venues.length}</b>
              </div>

              <button
                className={styles.assignBtn}
                onClick={() => {
                  setAssignMgr(m);
                  setSelectedVenues(m.venues);
                }}
              >
                <ClipboardList size={14} /> Assign Venues
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ADD MANAGER MODAL */}
      {showAdd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add Manager</h3>
              <button onClick={() => setShowAdd(false)}>
                <X size={16} />
              </button>
            </div>

            <input className={styles.input} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={styles.input} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className={styles.primaryBtn} onClick={addManager} disabled={submitting}>
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
            <h3>Assign Venues</h3>

            <div className={styles.checkboxGrid}>
              {venuesList.map((v) => (
                <label key={v} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={selectedVenues.includes(v)}
                    onChange={(e) =>
                      setSelectedVenues((prev) =>
                        e.target.checked
                          ? [...prev, v]
                          : prev.filter((x) => x !== v)
                      )
                    }
                  />
                  {v}
                </label>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.secondaryBtn} onClick={() => setAssignMgr(null)}>
                Cancel
              </button>
              <button className={styles.primaryBtn} onClick={saveAssignment}>
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
