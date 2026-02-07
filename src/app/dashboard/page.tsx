"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";

type Stats = {
  venues: number;
  staff: number;
  availableStaff: number;
  events: number;
  plans: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Dashboard load error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className={styles.container}>Loading dashboard…</div>;
  }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>Operations Dashboard</h1>
        <p className={styles.subtitle}>
          Executive overview of staffing, venues, and daily operations
        </p>
      </div>

      {/* KPI METRICS */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Key Metrics</h3>

        <div className={styles.cards}>
          <MetricCard
            title="Total Venues"
            value={stats.venues}
            description="Active operational locations"
          />
          <MetricCard
            title="Total Staff"
            value={stats.staff}
            description="Registered workforce"
          />
          <MetricCard
            title="Available Staff"
            value={stats.availableStaff}
            description="Currently deployable staff"
            highlight
          />
          <MetricCard
            title="Upcoming Events"
            value={stats.events}
            description="Scheduled operational events"
          />
          <MetricCard
            title="Active Plans"
            value={stats.plans}
            description="Staff allocation plans"
          />
        </div>
      </section>

      {/* MANAGEMENT ACTIONS */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Management Actions</h3>

        <div className={styles.actionsGrid}>
          <ActionCard
            title="Venue Management"
            description="Create and manage venues and service rules"
            href="/venues"
          />

          <ActionCard
            title="Staff Management"
            description="Manage staff profiles, roles, and availability"
            href="/staff"
          />

          <ActionCard
            title="Create Event"
            description="Schedule and manage operational events"
            href="/events"
          />

          <ActionCard
            title="Create Plan"
            description="Generate and review staffing allocation plans"
            href="/plans"
          />
        </div>
      </section>
    </div>
  );
}

/* =====================
   METRIC CARD
===================== */

function MetricCard({
  title,
  value,
  description,
  highlight
}: {
  title: string;
  value: number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`${styles.card} ${
        highlight ? styles.highlightCard : ""
      }`}
    >
      <div className={styles.cardTitle}>{title}</div>
      <div className={styles.cardValue}>{value}</div>
      <div className={styles.cardDescription}>{description}</div>
    </div>
  );
}

/* =====================
   ACTION CARD
===================== */

function ActionCard({
  title,
  description,
  href
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className={styles.actionCard}>
      <h4>{title}</h4>
      <p>{description}</p>
      <span className={styles.actionLink}>Open →</span>
    </Link>
  );
}
