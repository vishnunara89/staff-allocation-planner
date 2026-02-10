import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserRole, getUserId } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

type CountRow = { c: number };

/* =====================
   GET – Dashboard Stats
===================== */
export async function GET() {
  try {
    const role = getUserRole();
    const userId = getUserId();

    if (!role || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Helper function for counting
    const safeCount = (table: string, whereClause = "") => {
      return (db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${whereClause}`).get() as CountRow).c;
    };

    let venueIds: number[] = [];
    let venueIdFilter = "";

    if (role === "manager") {
      const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
      venueIds = assigned.map(v => v.venue_id).filter(id => id !== null);

      if (venueIds.length === 0) {
        // Return zeros if no venues assigned
        return NextResponse.json({
          venues: 0, staff: 0, availableStaff: 0, upcomingEvents: 0, activePlans: 0,
          staffAvailability: { available: 0, unavailable: 0 },
          employmentTypes: { internal: 0, external: 0 },
          venueTypes: { camp: 0, private: 0, other: 0 }
        });
      }

      venueIdFilter = ` WHERE venue_id IN (${venueIds.join(',')})`;
    }

    /* =====================
       TOTAL COUNTS
    ===================== */

    // For Managers, we scope by their assigned venues
    const totalVenues = role === "admin" ? safeCount("venues") : venueIds.length;

    // Filter IDs for SQL
    const idList = venueIds.length > 0 ? venueIds.join(",") : "0";

    // Staff scoped by home base venue if manager
    const staffWhereClause = role === "manager" ? `WHERE home_base_venue_id IN (${idList})` : "";
    const totalStaff = safeCount("staff", staffWhereClause);

    // Events scoped by venue
    const eventWhereClause = role === "manager" ? `WHERE venue_id IN (${idList})` : "";
    const upcomingEvents = safeCount("events", eventWhereClause);

    // Plans scoped by event's venue
    const planWhereClause = role === "manager" ? `WHERE venue_id IN (${idList})` : "";
    const activePlans = safeCount("staffing_plans", planWhereClause); // Table is staffing_plans

    /* =====================
       STAFF AVAILABILITY
    ===================== */
    const availWhere = `WHERE availability_status = 'available' ${role === 'manager' ? `AND home_base_venue_id IN (${idList})` : ""}`;
    const availableStaff = safeCount("staff", availWhere);
    const unavailableStaff = totalStaff - availableStaff;

    /* =====================
       EMPLOYMENT TYPE
    ===================== */
    const internalWhere = `WHERE employment_type = 'internal' ${role === 'manager' ? `AND home_base_venue_id IN (${idList})` : ""}`;
    const internalStaff = safeCount("staff", internalWhere);
    const externalStaff = totalStaff - internalStaff;

    /* =====================
       VENUE TYPES
    ===================== */
    const typeWhere = (type: string) => `WHERE type = '${type}' ${role === 'manager' ? `AND id IN (${idList})` : ""}`;
    const campVenues = safeCount("venues", typeWhere("camp"));
    const privateVenues = safeCount("venues", typeWhere("private"));
    const otherVenues = totalVenues - campVenues - privateVenues;

    return NextResponse.json({
      venues: totalVenues,
      staff: totalStaff,
      availableStaff,
      upcomingEvents,
      activePlans,
      staffAvailability: { available: availableStaff, unavailable: unavailableStaff },
      employmentTypes: { internal: internalStaff, external: externalStaff },
      venueTypes: { camp: campVenues, private: privateVenues, other: otherVenues },
    });
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
