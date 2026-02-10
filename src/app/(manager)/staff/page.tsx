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
    setModalMode("add");
    setEditingStaff({
        full_name: "",
        primary_role_id: roles[0]?.id || 1,
        secondary_roles: [],
        english_proficiency: "good",
        other_languages: {},
        special_skills: [],
        experience_tags: [],
        employment_type: "internal",
        availability_status: "available",
        notes: "",
    } as unknown as StaffMember);
    setIsModalOpen(true);
  }

  function openEditModal(member: StaffMember) {
    setModalMode("edit");
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
     UI (UNCHANGED)
  ========================= */
  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h2>Staff Roster</h2>
          <p>Manage fleet and availability</p>
        </div>
        <div className={styles.actions}>
          <button onClick={downloadCSVTemplate} className={styles.buttonSecondary}>
            <FileDown size={16} /> Template
          </button>
          <button
            onClick={() => exportToCSV(filteredStaff, roles, venues)}
            className={styles.buttonSecondary}
          >
            <Mail size={16} /> Export
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={styles.buttonSecondary}
          >
            <FileUp size={16} /> Import
          </button>
          <button onClick={openAddModal} className={styles.buttonPrimary}>
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {/* EMPTY */}
      {filteredStaff.length === 0 && (
        <div className={styles.emptyState}>No staff found</div>
      )}

      {/* IMPORT */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
