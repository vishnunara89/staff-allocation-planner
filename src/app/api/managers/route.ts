import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/* =====================
   GET – List Managers
===================== */
export async function GET() {
  try {
    const managers = db.prepare(`
      SELECT id, name, phone, username
      FROM users
      WHERE role = 'manager'
      ORDER BY name
    `).all();

    const result = managers.map((m: any) => {
      const venues = db.prepare(`
        SELECT venue_name
        FROM manager_venues
        WHERE manager_id = ?
      `)
        .all(m.id)
        .map((v: any) => v.venue_name);

      return { ...m, venues };
    });

    // ✅ Always return array
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET managers error:", err);
    // ✅ Prevent frontend crash
    return NextResponse.json([], { status: 200 });
  }
}

/* =====================
   POST – Create Manager
===================== */
export async function POST(req: Request) {
  try {
    const { name, phone, username, password } = await req.json();

    if (!name || !phone || !username || !password) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    const exists = db
      .prepare("SELECT id FROM users WHERE username = ?")
      .get(username);

    if (exists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (name, phone, username, password, role)
      VALUES (?, ?, ?, ?, 'manager')
    `).run(name, phone, username, hashedPassword);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Create manager error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* =====================
   PUT – Assign Venues
===================== */
export async function PUT(req: Request) {
  try {
    const { managerId, venues } = await req.json();

    if (!managerId || !Array.isArray(venues)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Clear existing
    db.prepare(
      "DELETE FROM manager_venues WHERE manager_id = ?"
    ).run(managerId);

    const insert = db.prepare(`
      INSERT INTO manager_venues (manager_id, venue_name)
      VALUES (?, ?)
    `);

    venues.forEach((v: string) => insert.run(managerId, v));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Assign venues error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* =====================
   DELETE – Remove Manager
===================== */
export async function DELETE(req: Request) {
  try {
    const { managerId } = await req.json();

    if (!managerId) {
      return NextResponse.json(
        { error: "Manager ID required" },
        { status: 400 }
      );
    }

    // Remove venue assignments first (safe)
    db.prepare(
      "DELETE FROM manager_venues WHERE manager_id = ?"
    ).run(managerId);

    // Remove user
    db.prepare(
      "DELETE FROM users WHERE id = ? AND role = 'manager'"
    ).run(managerId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete manager error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
