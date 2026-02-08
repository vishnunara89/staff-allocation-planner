"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MapPin,
    Users,
    Calendar,
    FileText,
    Diamond,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import styles from "./modern-sidebar.module.css";

const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/venues", label: "Venues", icon: MapPin },
    { href: "/staff", label: "Staff Roster", icon: Users },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/plans", label: "Plans", icon: FileText },
];

export default function ModernSidebar() {
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

    const sidebarClasses = `
    ${styles.sidebar} 
    ${isCollapsed ? styles.collapsed : ""} 
    ${isMobileOpen ? styles.mobileOpen : ""}
  `;

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
                    {!isCollapsed && <span className={styles.brandName}>NARA</span>}
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
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
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                )}

                <div className={styles.footer}>
                    <div className={styles.version}>{isCollapsed ? "v26" : "v2.0.26"}</div>
                </div>
            </aside>
        </>
    );
}
