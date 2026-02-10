"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileUp,
  FileDown,
  UserPlus,
  X,
  Loader2,
  Trash2,
  ArrowLeft
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
  const [filterRole, setFilterRole] = useState("");
  const [filterVenue, setFilterVenue] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<StaffMember | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  /* =========================
     FETCH DATA
  ========================= */
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
          experience_tags: safeJSON(s.experience_tags, []),
          employee_role: s.employee_role || "staff"
        })
      );

      setStaff(normalizedStaff);
      setVenues(Array.isArray(venuesRes) ? venuesRes : []);
      setRoles(Array.isArray(rolesRes) ? rolesRes : []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     HELPERS
  ========================= */
  const getVenueName = (id?: number | null) =>
    venues.find(v => v.id === id)?.name || "-";

  const getRoleName = (id: number) =>
    roles.find(r => r.id === id)?.name || "-";

  /* =========================
     FILTER
  ========================= */
  const filteredEmployees = staff.filter(emp => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (extractPhone(emp.notes) || "").includes(searchQuery);

    const matchesRole = !filterRole || emp.primary_role_id === Number(filterRole);
    const matchesVenue = !filterVenue || emp.home_base_venue_id === Number(filterVenue);
    const matchesStatus = !filterStatus || emp.availability_status === filterStatus;

    return matchesSearch && matchesRole && matchesVenue && matchesStatus;
  });

  /* =========================
     EXPORT CSV
  ========================= */
  function exportCSV() {
    const headers = ["Name", "Role", "Venue", "Phone", "Status", "Employee Role"];
    const rows = filteredEmployees.map(e => [
      e.full_name,
      getRoleName(e.primary_role_id),
      getVenueName(e.home_base_venue_id),
      extractPhone(e.notes) || "",
      e.availability_status,
      e.employee_role
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* =========================
     DELETE EMPLOYEE
  ========================= */
  async function deleteEmployee(id: number) {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedEmployee(null);
      fetchData();
    } catch {
      alert("Failed to delete employee");
    }
  }

  /* =========================
     LOADING
  ========================= */
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
          <button className={styles.buttonSecondary} onClick={exportCSV}>
            <FileDown size={18} /> Export
          </button>
          <button className={styles.buttonSecondary} onClick={() => setIsImportModalOpen(true)}>
            <FileUp size={18} /> Bulk Import
          </button>
          <button className={styles.buttonPrimary} onClick={() => setIsAddModalOpen(true)}>
            <UserPlus size={18} /> Add Employee
          </button>
        </div>
      </header>

      {/* ===== TABLE ===== */}
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

      {/* ===== VIEW PANEL ===== */}
      {selectedEmployee && (
        <>
          <div className={styles.overlay} onClick={() => setSelectedEmployee(null)} />
          <div className={styles.profileSlideOut}>
            <button className={styles.closeBtn} onClick={() => setSelectedEmployee(null)}>
              <X size={18} />
            </button>

            {/* ROLE BADGE */}
            <span
              style={{
                alignSelf: "flex-start",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "1rem",
                background:
                  selectedEmployee.employee_role === "admin"
                    ? "#fee2e2"
                    : selectedEmployee.employee_role === "manager"
                    ? "#e0f2fe"
                    : "#f1f5f9",
                color:
                  selectedEmployee.employee_role === "admin"
                    ? "#991b1b"
                    : selectedEmployee.employee_role === "manager"
                    ? "#0369a1"
                    : "#475569"
              }}
            >
              {selectedEmployee.employee_role.toUpperCase()}
            </span>

            <AdminEmployeeCard
              employee={{
                id: selectedEmployee.id,
                name: selectedEmployee.full_name,
                role: getRoleName(selectedEmployee.primary_role_id),
                phone: extractPhone(selectedEmployee.notes) || "",
                status: selectedEmployee.availability_status
              }}
            />

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button onClick={() => setSelectedEmployee(null)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button
                style={{ color: "red" }}
                onClick={() => deleteEmployee(selectedEmployee.id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </>
      )}

      <AdminImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
      />

      <EmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
        venues={venues}
        roles={roles}
      />
    </div>
  );
}
