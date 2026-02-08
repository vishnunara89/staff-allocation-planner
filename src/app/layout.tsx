import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import ModernSidebar from "@/components/ModernSidebar";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  variable: '--font-outfit',
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: "NARA Operational",
  description: "Advanced Staff Allocation System"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${cormorant.variable} ${outfit.className}`}>
        <div className="app-layout">
          <ModernSidebar />

          {/* MAIN CONTENT */}
          <main className="content-area">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
