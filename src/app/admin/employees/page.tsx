"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileUp,
  FileDown,
  UserPlus,
  X,
  Loader2
} from "lucide-react";
import styles from "./employees.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import AdminEmployeeCard from "@/components/AdminEmployeeCard";
import AdminImportModal from "@/components/AdminImportModal";
import EmployeeModal from "@/components/EmployeeModal";
import { StaffMember, Venue, Role } from "@/types";
import { extractPhone } from "@/lib/staff-utils";

/* =========================
   SAFE JSON PARSER
========================= */
function safeJSON<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

export default function AdminEmployeesPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [filterRole, setFilterRole] = useState("");
  const [filterVenue, setFilterVenue] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [staffRes, venuesRes, rolesRes] = await Promise.all([
        fetch("/api/staff").then(r => r.json()),
        fetch("/api/venues").then(r => r.json()),
        fetch("/api/roles").then(r => r.json())
      ]);

      const normalizedStaff: StaffMember[] = (Array.isArray(staffRes) ? staffRes : []).map(
        (s: any) => ({
          ...s,
          secondary_roles: safeJSON(s.secondary_roles, []),
          other_languages: safeJSON(s.other_languages, {}),
          special_skills: safeJSON(s.special_skills, []),
          experience_tags: safeJSON(s.experience_tags, [])
        })
      );

      setStaff(normalizedStaff);
      setVenues(Array.isArray(venuesRes) ? venuesRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
    } catch (err) {
      console.error("Failed to fetch admin employee data:", err);
      setStaff([]);
      setVenues([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }

  const getVenueName = (id?: number | null) =>
    venues.find(v => v.id === id)?.name || "-";

  const getRoleName = (id: number) =>
    roles.find(r => r.id === id)?.name || "-";

  const filteredEmployees = staff.filter(s => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (extractPhone(s.notes) || "").includes(searchQuery);

    const matchesRole = !filterRole || s.primary_role_id === Number(filterRole);
    const matchesVenue = !filterVenue || s.home_base_venue_id === Number(filterVenue);
    const matchesStatus = !filterStatus || s.availability_status === filterStatus;

    return matchesSearch && matchesRole && matchesVenue && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.container} style={{ display: "flex", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={48} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div>
          <h2>Employee Registry</h2>
          <p>Global workforce data across all operational sites.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.buttonSecondary}><FileDown size={18} /> Export</button>
          <button className={styles.buttonSecondary} onClick={() => setIsImportModalOpen(true)}>
            <FileUp size={18} /> Bulk Import
          </button>
          <button className={styles.buttonPrimary} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={18} /> Add Employee
          </button>
        </div>
      </header>

      {/* ===== FILTERS ===== */}
      <div className={styles.toolbar}>
        <div className={styles.filterGrid}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <CustomDropdown options={roles} value={filterRole} onChange={setFilterRole} placeholder="All Roles" />
          <CustomDropdown options={venues} value={filterVenue} onChange={setFilterVenue} placeholder="All Home Bases" />
          <CustomDropdown
            options={[
              { id: "available", name: "Available" },
              { id: "off", name: "Off" },
              { id: "leave", name: "Leave" }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Camp</th>
              <th>Phone</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id}>
                <td>{emp.full_name}</td>
                <td>{getRoleName(emp.primary_role_id)}</td>
                <td>{getVenueName(emp.home_base_venue_id)}</td>
                <td>{extractPhone(emp.notes) || "-"}</td>
                <td>{emp.availability_status}</td>
                <td>
                  <button onClick={() => setSelectedEmployee(emp)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEmployees.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            No employees found.
          </div>
        )}
      </div>

      {/* ===== MODALS ===== */}
      <AdminImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchData} />
      <EmployeeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchData} venues={venues} roles={roles} />
    </div>
  );
}
