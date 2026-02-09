import { NextResponse } from "next/server";
import db from "@/lib/db";
export const dynamic = "force-dynamic";

type CountRow = { c: number };
console.log("🔥 DASHBOARD API HIT 🔥");

export function GET() {
  try {
    const totalStaff =
      (db.prepare("SELECT COUNT(*) AS c FROM staff").get() as CountRow)?.c ?? 0;

    const totalVenues =
      (db.prepare("SELECT COUNT(*) AS c FROM venues").get() as CountRow)?.c ?? 0;

    const upcomingEvents =
      (db.prepare("SELECT COUNT(*) AS c FROM events").get() as CountRow)?.c ?? 0;

    const activePlans =
      (
        db.prepare(
          "SELECT COUNT(*) AS c FROM plans WHERE status = 'active'"
        ).get() as CountRow
      )?.c ?? 0;

    const availableStaff =
      (
        db.prepare(
          "SELECT COUNT(*) AS c FROM staff WHERE availability_status = 'available'"
        ).get() as CountRow
      )?.c ?? 0;

    const unavailableStaff = totalStaff - availableStaff;

    const internalStaff =
      (
        db.prepare(
          "SELECT COUNT(*) AS c FROM staff WHERE employment_type = 'internal'"
        ).get() as CountRow
      )?.c ?? 0;

    const externalStaff = totalStaff - internalStaff;

    const campVenues =
      (
        db.prepare(
          "SELECT COUNT(*) AS c FROM venues WHERE type = 'camp'"
        ).get() as CountRow
      )?.c ?? 0;

    const privateVenues =
      (
        db.prepare(
          "SELECT COUNT(*) AS c FROM venues WHERE type = 'private'"
        ).get() as CountRow
      )?.c ?? 0;

    const otherVenues = totalVenues - campVenues - privateVenues;

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
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
