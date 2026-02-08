"use client";

import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="dashboard">Loading dashboard…</div>;
  }

  return (
    <div className="dashboard">
      <h2>Operations Dashboard</h2>
      <p className="dashboard-subtitle">
        Live overview of venues, staffing, and operational planning
      </p>

      {/* KEY METRICS */}
      <section>
        <h3>Key Metrics</h3>
        <div className="card-grid">
          <MetricCard title="Total Venues" value={stats.venues} />
          <MetricCard title="Total Staff" value={stats.staff} />
          <MetricCard title="Available Staff" value={stats.availableStaff} />
          <MetricCard title="Upcoming Events" value={stats.upcomingEvents} />
          <MetricCard title="Active Plans" value={stats.activePlans} />
        </div>
      </section>

      {/* INSIGHTS */}
      <section>
        <h3>Operational Insights</h3>
        <div className="card-grid">
          <div className="card">
            <h4>Staff Availability</h4>
            <p>Available: {stats.staffAvailability.available}</p>
            <p>Unavailable: {stats.staffAvailability.unavailable}</p>
          </div>

          <div className="card">
            <h4>Venue Types</h4>
            <p>Camp: {stats.venueTypes.camp}</p>
            <p>Private: {stats.venueTypes.private}</p>
            <p>Other: {stats.venueTypes.other}</p>
          </div>

          <div className="card">
            <h4>Employment Type</h4>
            <p>Internal: {stats.employmentTypes.internal}</p>
            <p>External: {stats.employmentTypes.external}</p>
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      <section>
        <h3>Management Actions</h3>
        <div className="card-grid">
          <ActionCard href="/staff/new" title="Add Staff" />
          <ActionCard href="/venues/new" title="Add Venue" />
          <ActionCard href="/events/new" title="Create Event" />
          <ActionCard href="/plans/new" title="Create Plan" />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      <p style={{ fontSize: "2rem", fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function ActionCard({ href, title }: { href: string; title: string }) {
  return (
    <a href={href} className="card">
      <h4>{title}</h4>
      <p>Open</p>
    </a>
  );
}
