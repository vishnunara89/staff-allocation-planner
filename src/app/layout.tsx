import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using a standard font
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Nara Pulse",
    description: "Nara Desert Escape Staffing Management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="layout-container">
                    <header className="main-header">
                        <h1>Nara Pulse</h1>
                        <nav>
                            <a href="/venues">Venues</a>
                            <a href="/staff">Staff Roster</a>
                            <a href="/events">Events</a>
                            <a href="/plans">Plans</a>
                        </nav>
                    </header>
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
