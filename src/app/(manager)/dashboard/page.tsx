"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CheckCircle2,
  CalendarClock,
  FileCheck,
  PlusCircle,
  LogOut,
} from "lucide-react";
import Link from "next/link";

/* =====================
   TYPES
===================== */

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

/* =====================
   SAFE DEFAULT STATE
===================== */

const EMPTY_STATS: DashboardStats = {
  venues: 0,
  staff: 0,
  availableStaff: 0,
  upcomingEvents: 0,
  activePlans: 0,

  staffAvailability: {
    available: 0,
    unavailable: 0,
  },

  venueTypes: {
    camp: 0,
    private: 0,
    other: 0,
  },

  employmentTypes: {
    internal: 0,
    external: 0,
  },
};

/* =====================
   PAGE
===================== */

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================
     LOAD DASHBOARD
  ===================== */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load dashboard");

        const data = await res.json();
        setStats({ ...EMPTY_STATS, ...data });
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError("Unable to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* =====================
     LOGOUT
  ===================== */
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/login");
  };

  if (loading) {
    return <div className="empty-state">Loading NARA Intelligence…</div>;
  }

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  return (
    <div className="dashboard">
      {/* =====================
          HEADER WITH LOGOUT
      ===================== */}
      <header
        style={{
          marginBottom: "2.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1>Operations Dashboard</h1>
          <p className="text-muted">
            High-level overview of venues, staffing, and operational planning
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            color: "#b91c1c",
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {/* =====================
          KEY METRICS
      ===================== */}
      <section>
        <h3>Key Metrics</h3>
        <div className="dashboard-grid">
          <MetricCard title="Total Venues" value={stats.venues} icon={<Building2 size={18} />} />
          <MetricCard title="Total Staff" value={stats.staff} icon={<Users size={18} />} />
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
            <div style={{ marginTop: "1rem" }}>
              <ProgressStat
                label="Available"
                value={stats.staffAvailability.available}
                total={stats.staff}
                color="#166534"
              />
              <ProgressStat
                label="Unavailable"
                value={stats.staffAvailability.unavailable}
                total={stats.staff}
                color="#9B2C2C"
              />
            </div>
          </div>

          <div className="card">
            <h4>Venue Types</h4>
            <div style={{ marginTop: "1rem" }}>
              <Row label="Camp" value={stats.venueTypes.camp} />
              <Row label="Private" value={stats.venueTypes.private} />
              <Row label="Other" value={stats.venueTypes.other} />
            </div>
          </div>

          <div className="card">
            <h4>Employment Type</h4>
            <div style={{ marginTop: "1rem" }}>
              <ProgressStat
                label="Internal"
                value={stats.employmentTypes.internal}
                total={stats.staff}
                color="#7C4C2C"
              />
              <ProgressStat
                label="External"
                value={stats.employmentTypes.external}
                total={stats.staff}
                color="#1A120B"
              />
            </div>
          </div>

          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              border: "1px dashed var(--border-color)",
              background: "transparent",
            }}
          >
            <FileCheck size={32} color="var(--muted-color)" />
            <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
              {stats.activePlans} Active Plans
            </p>
          </div>
        </div>
      </section>

      {/* =====================
          MANAGEMENT ACTIONS
      ===================== */}
      <section>
        <h3>Management Actions</h3>

        <div className="action-grid">
          <ActionCard href="/staff" title="Add Staff" description="Create new staff profile" />
          <ActionCard href="/venues" title="Add Venue" description="Register new venue" />
          <ActionCard href="/events" title="Create Event" description="Schedule new event" />
          <ActionCard href="/plans" title="Create Plan" description="Generate allocation" />
        </div>
      </section>
    </div>
  );
}

/* =====================
   COMPONENTS
===================== */

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h4>{title}</h4>
        <div style={{ color: color || "var(--muted-color)" }}>{icon}</div>
      </div>
      <p style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

function ProgressStat({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total === 0 ? 0 : (value / total) * 100;

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: "4px", background: "#eee" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
      <span>{label}</span>
      <span className="badge">{value}</span>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="card" style={{ display: "flex", gap: "1rem" }}>
      <div
        style={{
          background: "var(--accent-color)",
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PlusCircle size={18} />
      </div>
      <div>
        <h4 style={{ margin: 0 }}>{title}</h4>
        <p className="text-muted" style={{ margin: 0, fontSize: "0.75rem" }}>
          {description}
        </p>
      </div>
    </Link>
  );
}
