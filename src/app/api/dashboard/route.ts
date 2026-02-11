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

    // Staff: Show GLOBAL count for both Admin and Manager (Centralized View)
    const totalStaff = safeCount("employees");

    // Upcoming Events: Scoped by venue for Managers (Operational View)
    const eventWhere = `WHERE date >= '${today}' ${role === "manager" ? `AND venue_id IN (${idList})` : ""}`;
    const upcomingEventsCount = safeCount("events", eventWhere);

    // Active Plans
    const planWhere = role === "manager" ? `WHERE venue_id IN (${idList})` : "";
    const activePlansQuery = `
      SELECT COUNT(DISTINCT event_date || '-' || venue_id) as c 
      FROM generated_plans gp
      JOIN events e ON gp.event_id = e.id
      ${planWhere}
    `;
    // Note: Switched to generated_plans table
    let activePlans = 0;
    try {
      activePlans = (db.prepare(activePlansQuery).get() as CountRow).c;
    } catch (e) {
      // Fallback or ignore if table empty/missing
      activePlans = 0;
    }

    /* =====================
       STAFF AVAILABILITY - Global for Managers too
    ===================== */
    const availWhere = `WHERE availability_status = 'available'`;
    const availableStaff = safeCount("employees", availWhere);
    const unavailableStaff = totalStaff - availableStaff;

    /* =====================
       EMPLOYMENT TYPE - Global for Managers too
    ===================== */
    const internalWhere = `WHERE employment_type = 'internal'`;
    const internalCount = safeCount("employees", internalWhere);
    const externalCount = totalStaff - internalCount;

    /* =====================
       VENUE TYPES - Remains Scoped
    ===================== */
    const typeQuery = (type: string) => `WHERE type = '${type}' ${role === "manager" && venueIds.length > 0 ? `AND id IN (${idList})` : ""}`;

    // Safety check for venue types query
    let campVenues = 0, privateVenues = 0;
    if (role === 'admin' || venueIds.length > 0) {
      campVenues = safeCount("venues", typeQuery("camp"));
      privateVenues = safeCount("venues", typeQuery("private"));
    }
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
