"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  CalendarClock,
  FileCheck,
  PlusCircle
} from "lucide-react";
import Link from "next/link";

type DashboardStats = {
  venues: number;
  staff: number;
  availableStaff: number;
  upcomingEvents: number;
  activePlans: number;

  staffAvailability: {
    available: number;
    unavailable: number;
  };

  venueTypes: {
    camp: number;
    private: number;
    other: number;
  };

  employmentTypes: {
    internal: number;
    external: number;
  };
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    // 🔁 Replace later with real API (/api/dashboard)
    setStats({
      venues: 6,
      staff: 42,
      availableStaff: 28,
      upcomingEvents: 5,
      activePlans: 3,

      staffAvailability: {
        available: 28,
        unavailable: 14
      },

      venueTypes: {
        camp: 3,
        private: 2,
        other: 1
      },

      employmentTypes: {
        internal: 30,
        external: 12
      }
    });
  }, []);

  if (!stats) {
    return <div className="empty-state">Loading NARA Intelligence…</div>;
  }

  return (
    <div className="dashboard">
      <header style={{ marginBottom: "2.5rem" }}>
        <h1>Operations Dashboard</h1>
        <p className="text-muted">
          High-level overview of venues, staffing, and operational planning
        </p>
      </header>

      {/* =====================
          KEY METRICS
      ===================== */}
      <section>
        <h3>Key Metrics</h3>
        <div className="dashboard-grid">
          <MetricCard
            title="Total Venues"
            value={stats.venues}
            icon={<Building2 size={18} />}
          />
          <MetricCard
            title="Total Staff"
            value={stats.staff}
            icon={<Users size={18} />}
          />
          <MetricCard
            title="Available Staff"
            value={stats.availableStaff}
            icon={<CheckCircle2 size={18} />}
            color="var(--success-color)"
          />
          <MetricCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={<CalendarClock size={18} />}
          />
        </div>
      </section>

      {/* =====================
          OPERATIONAL INSIGHTS
      ===================== */}
      <section>
        <h3>Operational Insights</h3>

        <div className="dashboard-grid">
          <div className="card">
            <h4>Staff Availability</h4>
            <div style={{ marginTop: '1rem' }}>
              <ProgressStat label="Available" value={stats.staffAvailability.available} total={stats.staff} color="#166534" />
              <ProgressStat label="Unavailable" value={stats.staffAvailability.unavailable} total={stats.staff} color="#9B2C2C" />
            </div>
          </div>

          <div className="card">
            <h4>Venue Types</h4>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span>Camp</span>
                <span className="badge">{stats.venueTypes.camp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                <span>Private</span>
                <span className="badge">{stats.venueTypes.private}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Other</span>
                <span className="badge">{stats.venueTypes.other}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4>Employment Type</h4>
            <div style={{ marginTop: '1rem' }}>
              <ProgressStat label="Internal" value={stats.employmentTypes.internal} total={stats.staff} color="#7C4C2C" />
              <ProgressStat label="External" value={stats.employmentTypes.external} total={stats.staff} color="#1A120B" />
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px dashed var(--border-color)', background: 'transparent' }}>
            <FileCheck size={32} color="var(--muted-color)" />
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{stats.activePlans} Active Plans</p>
          </div>
        </div>
      </section>

      {/* =====================
          QUICK ACTIONS
      ===================== */}
      <section>
        <h3>Management Actions</h3>

        <div className="action-grid">
          <ActionCard
            href="/staff/new"
            title="Add Staff"
            description="Create new staff profile"
          />

          <ActionCard
            href="/venues/new"
            title="Add Venue"
            description="Register new venue"
          />

          <ActionCard
            href="/events/new"
            title="Create Event"
            description="Schedule new event"
          />

          <ActionCard
            href="/plans/new"
            title="Create Plan"
            description="Generate allocation"
          />
        </div>
      </section>
    </div>
  );
}

/* =====================
   SMALL COMPONENTS
===================== */

function MetricCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <h4>{title}</h4>
        <div style={{ color: color || "var(--muted-color)" }}>{icon}</div>
      </div>
      <p style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

function ProgressStat({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = (value / total) * 100;
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ width: "100%", height: "4px", background: "#f1f1f0", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ background: 'var(--accent-color)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C4C2C' }}>
        <PlusCircle size={20} />
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{title}</h4>
        <p className="text-muted" style={{ margin: 0, fontSize: '0.75rem' }}>{description}</p>
      </div>
    </Link>
  );
}
