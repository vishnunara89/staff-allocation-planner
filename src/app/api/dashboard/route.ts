import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

type CountRow = { c: number };

/* =====================
   TABLE CHECK
===================== */
function tableExists(table: string): boolean {
  try {
    const row = db
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1"
      )
      .get(table);
    return !!row;
  } catch {
    return false;
  }
}

/* =====================
   SAFE COUNT
===================== */
function safeCount(query: string, table: string): number {
  if (!tableExists(table)) return 0;
  return (db.prepare(query).get() as CountRow)?.c ?? 0;
}

export function GET() {
  try {
    /* =====================
       TOTAL COUNTS
    ===================== */

    const totalStaff = safeCount(
      "SELECT COUNT(*) AS c FROM staff",
      "staff"
    );

    const totalVenues = safeCount(
      "SELECT COUNT(*) AS c FROM venues",
      "venues"
    );

    const upcomingEvents = safeCount(
      "SELECT COUNT(*) AS c FROM events",
      "events"
    );

    /* =====================
       PLANS
    ===================== */

    const activePlans = safeCount(
      "SELECT COUNT(*) AS c FROM plans WHERE status = 'active'",
      "plans"
    );

    /* =====================
       STAFF AVAILABILITY
    ===================== */

    const availableStaff = safeCount(
      "SELECT COUNT(*) AS c FROM staff WHERE availability_status = 'available'",
      "staff"
    );

    const unavailableStaff = totalStaff - availableStaff;

    /* =====================
       EMPLOYMENT TYPE
    ===================== */

    const internalStaff = safeCount(
      "SELECT COUNT(*) AS c FROM staff WHERE employment_type = 'internal'",
      "staff"
    );

    const externalStaff = totalStaff - internalStaff;

    /* =====================
       VENUE TYPES
    ===================== */

    const campVenues = safeCount(
      "SELECT COUNT(*) AS c FROM venues WHERE type = 'camp'",
      "venues"
    );

    const privateVenues = safeCount(
      "SELECT COUNT(*) AS c FROM venues WHERE type = 'private'",
      "venues"
    );

    const otherVenues = totalVenues - campVenues - privateVenues;

    /* =====================
       RESPONSE
    ===================== */

    return NextResponse.json({
      venues: totalVenues,
      staff: totalStaff,
      availableStaff,
      upcomingEvents,
      activePlans,

      staffAvailability: {
        available: availableStaff,
        unavailable: unavailableStaff,
      },

      employmentTypes: {
        internal: internalStaff,
        external: externalStaff,
      },

      venueTypes: {
        camp: campVenues,
        private: privateVenues,
        other: otherVenues,
      },
    });
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
