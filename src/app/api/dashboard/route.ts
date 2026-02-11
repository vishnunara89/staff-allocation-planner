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
      const sql = `SELECT COUNT(*) AS c FROM ${table} ${whereClause}`;
      return (db.prepare(sql).get() as CountRow).c;
    };

    let venueIds: number[] = [];
    let idList = "0";

    if (role === "manager") {
      const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
      venueIds = assigned.map(v => v.venue_id).filter(id => id !== null);

      if (venueIds.length === 0) {
        return NextResponse.json({
          venues: 0, staff: 0, availableStaff: 0, upcomingEvents: 0, activePlans: 0,
          staffAvailability: { available: 0, unavailable: 0 },
          employmentTypes: { internal: 0, external: 0 },
          venueTypes: { camp: 0, private: 0, other: 0 }
        });
      }
      idList = venueIds.join(',');
    }

    // Today's date for event filtering
    const today = new Date().toISOString().split('T')[0];

    /* =====================
       TOTAL COUNTS
    ===================== */
    const totalVenues = role === "admin" ? safeCount("venues") : venueIds.length;

    // Staff scoped by home base venue if manager
    const staffWhere = role === "manager" ? `WHERE home_base_venue_id IN (${idList})` : "";
    const totalStaff = safeCount("employees", staffWhere);

    // Upcoming Events scoped by venue and date
    const eventWhere = `WHERE date >= '${today}' ${role === "manager" ? `AND venue_id IN (${idList})` : ""}`;
    const upcomingEventsCount = safeCount("events", eventWhere);

    // Active Plans count based on distinct event/venue pairings in staffing_plans
    // Note: This logic assumes a plan is associated with an event
    const planWhere = role === "manager" ? `WHERE venue_id IN (${idList})` : "";
    const activePlansQuery = `
      SELECT COUNT(DISTINCT event_date || '-' || venue_id) as c 
      FROM staffing_plans 
      ${planWhere}
    `;
    const activePlans = (db.prepare(activePlansQuery).get() as CountRow).c;

    /* =====================
       STAFF AVAILABILITY
    ===================== */
    const availWhere = `WHERE availability_status = 'available' ${role === 'manager' ? `AND home_base_venue_id IN (${idList})` : ""}`;
    const availableStaff = safeCount("employees", availWhere);
    const unavailableStaff = totalStaff - availableStaff;

    /* =====================
       EMPLOYMENT TYPE
    ===================== */
    // Map internal vs others (freelance, agency etc)
    const internalWhere = `WHERE employment_type = 'internal' ${role === 'manager' ? `AND home_base_venue_id IN (${idList})` : ""}`;
    const internalCount = safeCount("employees", internalWhere);
    const externalCount = totalStaff - internalCount;

    /* =====================
       VENUE TYPES
    ===================== */
    const typeQuery = (type: string) => `WHERE type = '${type}' ${role === 'manager' ? `AND id IN (${idList})` : ""}`;
    const campVenues = safeCount("venues", typeQuery("camp"));
    const privateVenues = safeCount("venues", typeQuery("private"));
    const otherVenues = totalVenues - campVenues - privateVenues;

    return NextResponse.json({
      venues: totalVenues,
      staff: totalStaff,
      availableStaff,
      upcomingEvents: upcomingEventsCount,
      activePlans,
      staffAvailability: { available: availableStaff, unavailable: unavailableStaff },
      employmentTypes: { internal: internalCount, external: externalCount },
      venueTypes: { camp: campVenues, private: privateVenues, other: otherVenues },
    });
  } catch (error) {
    console.error("❌ Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
