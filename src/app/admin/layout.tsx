"use client";

import AdminSidebar from "@/components/AdminSidebar";
import styles from "./admin-layout.module.css";

export default function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.adminLayout}>
            <AdminSidebar />
            <main className={styles.adminContent}>
                {children}
            </main>
        </div>
    );
}
