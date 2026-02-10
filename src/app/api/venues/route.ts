import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin, getUserRole, getUserId } from "@/lib/auth-utils";

/* ======================
   GET – List Venues
====================== */
export async function GET() {
  try {
    const role = getUserRole();
    const userId = getUserId();

    if (!role || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = "SELECT * FROM venues";
    let params: any[] = [];

    if (role === "manager") {
      const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
      const ids = assigned.map(v => v.venue_id).filter(id => id !== null);

      if (ids.length === 0) return NextResponse.json([]);

      query += ` WHERE id IN (${ids.join(',')})`;
    }

    query += " ORDER BY name ASC";
    const venues = db.prepare(query).all(...params);

    return NextResponse.json(venues);
  } catch (err) {
    console.error("GET venues error:", err);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}

/* ======================
   POST – Create Venue
===================== */
export async function POST(req: Request) {
  try {
    if (!isAdmin()) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Venue name is required" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO venues (name, type, default_service_style, notes)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      body.name.trim(),
      body.type || "camp",
      body.default_service_style || "sharing",
      body.notes || null
    );

    const venue = db
      .prepare("SELECT * FROM venues WHERE id = ?")
      .get(result.lastInsertRowid);

    return NextResponse.json(venue, { status: 201 });
  } catch (err: any) {
    console.error("POST venue error:", err);

    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Venue already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
