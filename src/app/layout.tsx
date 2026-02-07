import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Nara Pulse",
  description: "Staff Allocation Planner – Manager Dashboard"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <div className="app-layout">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-brand">
              🧭 <span>Nara Pulse</span>
            </div>

            <nav className="sidebar-nav">
              <a href="/" className="active">Overview</a>
              <a href="/venues">Venues</a>
              <a href="/staff">Staff Roster</a>
              <a href="/events">Events</a>
              <a href="/plans">Plans</a>
            </nav>
          </aside>

          {/* MAIN CONTENT */}
          <main className="content-area">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
