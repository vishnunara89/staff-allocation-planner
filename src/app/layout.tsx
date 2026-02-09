import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NARA Operational",
  description: "Advanced Staff Allocation System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-root">
        {children}
      </body>
    </html>
  );
}
