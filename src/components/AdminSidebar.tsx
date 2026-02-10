"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MapPin,
    UserCheck,
    Settings,
    Calendar,
    FileText,
    ClipboardList,
    Diamond,
    Menu,
    X,
    LogOut,
    Shield
} from "lucide-react";
import styles from "./admin-sidebar.module.css";

const adminNavItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/managers", label: "Managers", icon: Shield },
    { href: "/admin/venues", label: "Venues / Camps", icon: MapPin },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/rules", label: "Manning Rules", icon: Settings },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/plans", label: "Plans", icon: FileText },
    { href: "/admin/activity", label: "Activity Log", icon: ClipboardList },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (mobile) setIsCollapsed(false);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);
    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "/login";
        }
    };

    const sidebarClasses = [
        styles.sidebar,
        isCollapsed ? styles.collapsed : "",
        isMobileOpen ? styles.mobileOpen : ""
    ].filter(Boolean).join(" ");

    return (
        <>
            {/* Mobile Menu Button */}
            {isMobile && (
                <button className={styles.mobileToggle} onClick={toggleMobile}>
                    {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            )}

            {/* Backdrop for mobile */}
            {isMobile && isMobileOpen && (
                <div className={styles.backdrop} onClick={toggleMobile} />
            )}

            <aside className={sidebarClasses}>
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <Diamond size={24} fill="currentColor" />
                    </div>
                    {!isCollapsed && (
                        <div className={styles.brandText}>
                            <span className={styles.brandName}>NARA</span>
                            <span className={styles.brandTag}>ADMIN</span>
                        </div>
                    )}
                </div>

                <nav className={styles.nav}>
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                title={isCollapsed ? item.label : ""}
                            >
                                <Icon size={20} className={styles.icon} />
                                {!isCollapsed && <span className={styles.label}>{item.label}</span>}
                                {isActive && !isCollapsed && <div className={styles.indicator} />}
                            </Link>
                        );
                    })}
                </nav>

                {!isMobile && (
                    <button className={styles.collapseToggle} onClick={toggleCollapse} aria-label="Toggle Sidebar">
                        <Menu size={16} />
                    </button>
                )}

                <div className={styles.adminFooter}>
                    <div className={styles.adminProfile}>
                        <div className={styles.avatar}>A</div>
                        {!isCollapsed && (
                            <div className={styles.profileInfo}>
                                <div className={styles.profileName}>Admin User</div>
                                <div className={styles.profileRole}>System Administrator</div>
                            </div>
                        )}
                    </div>
                    <button className={styles.logoutBtn} title="Logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                    <div className={styles.version}>{isCollapsed ? "v26" : "v2.0.26 Admin"}</div>
                </div>
            </aside>
        </>
    );
}
