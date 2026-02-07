"use client";

import Link from "next/link";
import styles from "./sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Operations</div>

      <nav className={styles.nav}>
        <Link href="/" className={styles.active}>Dashboard</Link>
        <Link href="/venues">Venues</Link>
        <Link href="/staff">Staff Roster</Link>
        <Link href="/events">Events</Link>
        <Link href="/plans">Plans</Link>
      </nav>
    </aside>
  );
}
