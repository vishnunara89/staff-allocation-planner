"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  UserPlus,
  FileDown,
  FileUp,
  Search,
  X,
  Phone,
  Mail,
  Edit3,
  Trash2,
  Briefcase,
  MapPin,
  CheckCircle2,
} from "lucide-react";

import { StaffMember, Venue, Role } from "@/types";
import styles from "./staff.module.css";

import {
  extractPhone,
  updatePhoneInNotes,
  exportToCSV,
  downloadCSVTemplate,
} from "@/lib/staff-utils";

import CustomDropdown from "@/components/CustomDropdown";
import StatusDropdown from "@/components/StatusDropdown";
import BulkImportModal from "@/components/BulkImportModal";
import EmployeeModal from "@/components/EmployeeModal";

/* =========================
   SAFE ARRAY HELPER
========================= */
function asArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterVenue, setFilterVenue] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tempSkill, setTempSkill] = useState("");
  const [tempLang, setTempLang] = useState("");
  const [tempLangLevel, setTempLangLevel] = useState("good");

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================
     FETCH DATA (FIXED)
  ========================= */
  async function fetchData() {
    try {
      setLoading(true);

      const [staffRes, venuesRes, rolesRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/venues"),
        fetch("/api/roles"),
      ]);

      const staffJson = await staffRes.json();
      const venuesJson = await venuesRes.json();
      const rolesJson = await rolesRes.json();

      setStaff(asArray<StaffMember>(staffJson));
      setVenues(asArray<Venue>(venuesJson));
      setRoles(asArray<Role>(rolesJson));
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
      setStaff([]);
      setVenues([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  const getVenueName = (id?: number) =>
    venues.find((v) => v.id === id)?.name || "-";

  const getRoleName = (id: number) =>
    roles.find((r) => r.id === id)?.name || "-";

  /* =========================
     FILTER (NOW SAFE)
  ========================= */
  const filteredStaff = staff.filter((s) => {
    if (!s?.full_name) return false;

    const matchesSearch = s.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesRole =
      !filterRole || s.primary_role_id === Number(filterRole);

    const matchesVenue =
      !filterVenue || s.home_base_venue_id === Number(filterVenue);

    const matchesStatus =
      !filterStatus || s.availability_status === filterStatus;

    return matchesSearch && matchesRole && matchesVenue && matchesStatus;
  });

  /* =========================
     STATUS UPDATE
  ========================= */
  async function handleStatusChange(member: StaffMember, newStatus: string) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...member, availability_status: newStatus }),
      });

      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) =>
            s.id === member.id
              ? { ...s, availability_status: newStatus as any }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  /* =========================
     MODALS
  ========================= */
  function openAddModal() {
    // Disabled in read-only mode
  }

  function openEditModal(member: StaffMember) {
    setEditingStaff({ ...member });
    setIsModalOpen(true);
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterRole("");
    setFilterVenue("");
    setFilterStatus("");
  }

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>Loading staff…</div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h2>Staff Roster</h2>
          <p>View workforce data and availability</p>
        </div>
        <div className={styles.actions}>
          <button
            onClick={() => exportToCSV(filteredStaff, roles, venues)}
            className={styles.buttonSecondary}
          >
            <Mail size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* SEARCH/FILTER */}
      <div className={styles.toolbar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <CustomDropdown
            options={roles}
            value={filterRole}
            onChange={setFilterRole}
            placeholder="All Roles"
          />
          <CustomDropdown
            options={venues}
            value={filterVenue}
            onChange={setFilterVenue}
            placeholder="All Venues"
          />
          <StatusDropdown
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className={styles.tableContainer}>
        {filteredStaff.length === 0 ? (
          <div className={styles.emptyState}>No staff found</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Home Base</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.full_name}</b></td>
                  <td>{getRoleName(s.primary_role_id)}</td>
                  <td>{getVenueName(s.home_base_venue_id)}</td>
                  <td>
                    <span className={styles.tag} style={{
                      background: s.availability_status === 'available' ? '#dcfce7' : s.availability_status === 'leave' ? '#fff7ed' : '#f1f5f9',
                      color: s.availability_status === 'available' ? '#166534' : s.availability_status === 'leave' ? '#9a3412' : '#475569',
                      textTransform: 'capitalize',
                      borderRadius: '20px',
                      padding: '4px 10px'
                    }}>
                      {s.availability_status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openEditModal(s)} className={styles.buttonAction}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VIEW MODAL (EmployeeModal in read-only mode if it supports it, or just use it as is but no save) */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        venues={venues}
        roles={roles}
        initialData={editingStaff}
        readOnly={true}
      />
    </div>
  );
}
