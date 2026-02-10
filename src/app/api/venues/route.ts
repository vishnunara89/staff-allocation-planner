import { NextResponse } from "next/server";
import db from "@/lib/db";

/* ======================
   GET – List Venues
====================== */
export async function GET() {
  try {
    const venues = db
      .prepare("SELECT * FROM venues ORDER BY name ASC")
      .all();

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
====================== */
export async function POST(req: Request) {
  try {
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
