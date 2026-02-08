import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // Venues
    const venues = db
      .prepare("SELECT COUNT(*) as count FROM venues")
      .get()?.count ?? 0;

    // Staff
    const staff = db
      .prepare("SELECT COUNT(*) as count FROM staff")
      .get()?.count ?? 0;

    // Available Staff
    const availableStaff = db
      .prepare(
        "SELECT COUNT(*) as count FROM staff WHERE availability_status = 'available'"
      )
      .get()?.count ?? 0;

    // Upcoming Events (today onwards)
    const upcomingEvents = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM events 
         WHERE date >= DATE('now')`
      )
      .get()?.count ?? 0;

    // Active Plans
    const activePlans = db
      .prepare("SELECT COUNT(*) as count FROM plans")
      .get()?.count ?? 0;

    // Staff Availability Breakdown
    const availability = db
      .prepare(
        `SELECT availability_status, COUNT(*) as count
         FROM staff
         GROUP BY availability_status`
      )
      .all() as any[];

    const staffAvailability = {
      available: availability.find(a => a.availability_status === "available")
        ?.count ?? 0,
      unavailable:
        availability.find(a => a.availability_status === "unavailable")
          ?.count ?? 0
    };

    // Venue Types
    const venueTypeRows = db
      .prepare(
        `SELECT type, COUNT(*) as count
         FROM venues
         GROUP BY type`
      )
      .all() as any[];

    const venueTypes = {
      camp: venueTypeRows.find(v => v.type === "camp")?.count ?? 0,
      private: venueTypeRows.find(v => v.type === "private")?.count ?? 0,
      other: venueTypeRows.find(v => v.type === "other")?.count ?? 0
    };

    // Employment Types
    const employmentRows = db
      .prepare(
        `SELECT employment_type, COUNT(*) as count
         FROM staff
         GROUP BY employment_type`
      )
      .all() as any[];

    const employmentTypes = {
      internal:
        employmentRows.find(e => e.employment_type === "internal")?.count ?? 0,
      external:
        employmentRows.find(e => e.employment_type === "external")?.count ?? 0
    };

    return NextResponse.json({
      venues,
      staff,
      availableStaff,
      upcomingEvents,
      activePlans,
      staffAvailability,
      venueTypes,
      employmentTypes
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    // 🔒 Never break dashboard UI
    return NextResponse.json({
      venues: 0,
      staff: 0,
      availableStaff: 0,
      upcomingEvents: 0,
      activePlans: 0,
      staffAvailability: { available: 0, unavailable: 0 },
      venueTypes: { camp: 0, private: 0, other: 0 },
      employmentTypes: { internal: 0, external: 0 }
    });
  }
}
