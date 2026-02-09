"use client";

import ModernSidebar from "@/components/ModernSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-layout">
      <ModernSidebar />
      <main className="content-area" role="main">
        {children}
      </main>
    </div>
  );
}
