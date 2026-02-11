"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileDown,
  Loader2,
  Pencil,
  Phone as PhoneIcon,
  MessageSquare,
  Clock,
  CalendarDays
} from "lucide-react";
import styles from "./staff.module.css";
import CustomDropdown from "@/components/CustomDropdown";
import EmployeeModal from "@/components/EmployeeModal";
import { StaffMember, Venue, Role } from "@/types";
import { exportToCSV } from "@/lib/staff-utils";

function extractPhone(notes?: string): string {
  if (!notes) return '';
  const match = notes.match(/Phone: (.*?)(\n|$)/);
  return match ? match[1] : '';
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<StaffMember | null>(null);

  // Filters
  const [filterRole, setFilterRole] = useState("");
  const [filterVenue, setFilterVenue] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [staffData, venuesData, rolesData, eventsData] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/venues').then(r => r.json()),
        fetch('/api/roles').then(r => r.json()),
        fetch('/api/events').then(r => r.json()).catch(() => [])
      ]);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setVenues(Array.isArray(venuesData) ? venuesData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      console.error('Failed to fetch staff data:', err);
    } finally {
      setLoading(false);
    }
  }

  const getVenueName = (id?: number | null) => {
    if (!id) return '-';
    return venues.find(v => v.id === id)?.name || '-';
  };
  const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || '-';
  const getEventName = (id?: number | null) => {
    if (!id) return null;
    const ev = events.find(e => e.id === id);
    return ev ? `${ev.venue_name || 'Event'} — ${ev.date}` : null;
  };

  const filteredEmployees = staff.filter(s => {
    const phone = s.phone || extractPhone(s.notes);
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery);
    const matchesRole = !filterRole || s.primary_role_id === Number(filterRole);
    const matchesVenue = !filterVenue || s.home_base_venue_id === Number(filterVenue);
    const matchesStatus = !filterStatus || s.availability_status === filterStatus;
    return matchesSearch && matchesRole && matchesVenue && matchesStatus;
  });

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={48} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2>Employees</h2>
          <p>Global workforce data across all operational sites.</p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.buttonSecondary}
            onClick={() => exportToCSV(filteredEmployees, roles, venues)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #e2e8f0', padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
          >
            <FileDown size={18} /> Export
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGrid}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by name, phone, or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 1rem 0 3rem',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                background: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
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
            placeholder="All Home Bases"
          />
          <CustomDropdown
            options={[
              { id: 'available', name: 'Available' },
              { id: 'off', name: 'Off' },
              { id: 'leave', name: 'Leave' }
            ]}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="All Statuses"
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Camp</th>
              <th>Phone</th>
              <th style={{ textAlign: 'center' }}>Contact</th>
              <th>Status</th>
              <th>Event</th>
              <th>Hours</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => {
              const phone = emp.phone || extractPhone(emp.notes);
              const eventName = getEventName(emp.current_event_id);
              const cleanPhone = phone.replace(/[^0-9+]/g, '');
              return (
                <tr key={emp.id}>
                  <td>
                    <div className={styles.staffNameWrapper}>
                      <div className={styles.staffAvatar}>
                        {emp.full_name.charAt(0)}
                      </div>
                      <div className={styles.staffMeta}>
                        <div className={styles.staffName}>{emp.full_name}</div>
                        <div className={styles.tagCloud}>
                          {emp.english_proficiency && (
                            <span className={`${styles.tag} ${styles.tagLanguage}`}>
                              EN: {emp.english_proficiency}
                            </span>
                          )}
                          {(emp.special_skills as string[] || []).map(skill => (
                            <span key={skill} className={`${styles.tag} ${styles.tagSkill}`}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{getRoleName(emp.primary_role_id)}</td>
                  <td>{getVenueName(emp.home_base_venue_id)}</td>
                  <td style={{ fontSize: '0.9rem', color: '#64748b' }}>{phone || '-'}</td>
                  <td>
                    <div className={styles.contactCell} style={{ justifyContent: 'center' }}>
                      {/* WhatsApp */}
                      <a
                        href={cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={`${styles.iconButton} ${styles.whatsapp} ${!cleanPhone ? styles.disabled : ''}`}
                        title={cleanPhone ? "WhatsApp" : "No phone"}
                        onClick={e => !cleanPhone && e.preventDefault()}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cleanPhone ? 'rgba(37, 211, 102, 0.1)' : '#f1f5f9', color: cleanPhone ? '#25D366' : '#cbd5e1', textDecoration: 'none', transition: 'all 0.2s' }}
                      >
                        <MessageSquare size={16} />
                      </a>
                      {/* Phone Call */}
                      <a
                        href={cleanPhone ? `tel:${cleanPhone}` : '#'}
                        className={`${styles.iconButton} ${!cleanPhone ? styles.disabled : ''}`}
                        title={cleanPhone ? "Call" : "No phone"}
                        onClick={e => !cleanPhone && e.preventDefault()}
                        style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: cleanPhone ? 'rgba(124, 76, 44, 0.08)' : '#f1f5f9', color: cleanPhone ? '#7C4C2C' : '#cbd5e1', textDecoration: 'none', transition: 'all 0.2s' }}
                      >
                        <PhoneIcon size={16} />
                      </a>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: emp.availability_status === 'available' ? '#dcfce7' : emp.availability_status === 'leave' ? '#fff7ed' : '#f1f5f9',
                      color: emp.availability_status === 'available' ? '#166534' : emp.availability_status === 'leave' ? '#9a3412' : '#475569',
                      textTransform: 'capitalize'
                    }}>
                      {emp.availability_status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {eventName ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '3px 8px', background: '#f0f9ff', borderRadius: '6px',
                        fontSize: '0.8rem', fontWeight: 600, color: '#0369a1'
                      }}>
                        <CalendarDays size={13} /> {eventName}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {emp.working_hours ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '3px 8px', background: '#faf5ff', borderRadius: '6px',
                        fontSize: '0.8rem', fontWeight: 600, color: '#7c3aed'
                      }}>
                        <Clock size={13} /> {emp.working_hours}h
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => { setEditingEmployee(emp); setIsEditModalOpen(true); }}
                        style={{
                          background: 'none', border: '1.5px solid #e2e8f0',
                          padding: '6px 12px', borderRadius: '8px',
                          fontSize: '0.8rem', fontWeight: 700, color: '#64748b',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}
                        title="Edit Employee"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>No employees found matching your criteria.</div>
        )}
      </div>

      <EmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingEmployee(null); }}
        onSuccess={() => { fetchData(); setEditingEmployee(null); }}
        venues={venues}
        roles={roles}
        initialData={editingEmployee}
        readOnly={false}
      />
    </div>
  );
}
