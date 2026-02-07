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

  useEffect(() => {
    // Replace later with real API
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
    return <div className="dashboard">Loading dashboard…</div>;
  }

  return (
    <div className="dashboard">
   
      <h2>Dashboard</h2>
      <p className="dashboard-subtitle">
        Overview of operations, staffing, and planning
      </p>

     
      <div className="card-grid">
        <div className="card">
          <h3>Total Venues</h3>
          <p>{stats.venues}</p>
        </div>

        <div className="card">
          <h3>Total Staff</h3>
          <p>{stats.staff}</p>
        </div>

        <div className="card">
          <h3>Available Staff</h3>
          <p>{stats.availableStaff}</p>
        </div>

        <div className="card">
          <h3>Upcoming Events</h3>
          <p>{stats.upcomingEvents}</p>
        </div>

        <div className="card">
          <h3>Active Plans</h3>
          <p>{stats.activePlans}</p>
        </div>
      </div>

    
      <h2 style={{ marginTop: "3rem" }}>Operations Insight</h2>

      <div className="card-grid">
        <div className="card">
          <h3>Staff Availability</h3>
          <p>Available: {stats.staffAvailability.available}</p>
          <p>Unavailable: {stats.staffAvailability.unavailable}</p>
        </div>

        <div className="card">
          <h3>Venue Types</h3>
          <p>Camp: {stats.venueTypes.camp}</p>
          <p>Private: {stats.venueTypes.private}</p>
          <p>Other: {stats.venueTypes.other}</p>
        </div>

        <div className="card">
          <h3>Employment Type</h3>
          <p>Internal: {stats.employmentTypes.internal}</p>
          <p>External: {stats.employmentTypes.external}</p>
        </div>
      </div>

      <h2 style={{ marginTop: "3rem" }}>Quick Actions</h2>

      <div className="card-grid">
        <a href="/staff/new" className="card">
          <h3>➕ Add Staff</h3>
          <p>Create a new staff member</p>
        </a>

        <a href="/venues/new" className="card">
          <h3>➕ Add Venue</h3>
          <p>Create a new venue</p>
        </a>

        <a href="/events/new" className="card">
          <h3>📅 Create Event</h3>
          <p>Schedule an upcoming event</p>
        </a>

        <a href="/plans/new" className="card">
          <h3>🧠 Create Plan</h3>
          <p>Generate a staffing plan</p>
        </a>
      </div>
    </div>
  );
}
