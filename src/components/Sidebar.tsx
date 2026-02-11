"use client";

import Link from "next/link";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Operations</div>

      <nav className={styles.nav}>
        <Link href="/" className={styles.active}>Dashboard</Link>
        <Link href="/venues" className={styles.active}>Venues</Link>
        <Link href="/staff" className={styles.active}>Employees</Link>
        <Link href="/events" className={styles.active}>Events</Link>
        <Link href="/plans" className={styles.active}>Plans</Link>
      </nav>
    </aside>
  );
}
