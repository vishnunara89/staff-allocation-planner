import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { isAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

/* =====================
   GET – List Managers
===================== */
export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  try {
    const managers = db.prepare(`
      SELECT id, name, phone, username
      FROM users
      WHERE role = 'manager'
      ORDER BY name
    `).all();

    const result = managers.map((m: any) => {
      const assigned = db.prepare(`
        SELECT mv.venue_id, v.name as venue_name
        FROM manager_venues mv
        LEFT JOIN venues v ON mv.venue_id = v.id
        WHERE mv.manager_id = ?
      `).all(m.id) as { venue_id: number, venue_name: string }[];

      return {
        ...m,
        venueIds: assigned.map(v => v.venue_id).filter(id => id !== null),
        venues: assigned.map(v => v.venue_name).filter(name => name !== null)
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET managers error:", err);
    return NextResponse.json([], { status: 200 });
  }
}

/* =====================
   POST – Create Manager
===================== */
// ... (POST remains same)
export async function POST(req: Request) {
  try {
    if (!isAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
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
    if (!isAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { managerId, venueIds } = await req.json();

    if (!managerId || !Array.isArray(venueIds)) {
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
      INSERT INTO manager_venues (manager_id, venue_id)
      VALUES (?, ?)
    `);

    venueIds.forEach((vid: number) => {
      if (vid) insert.run(managerId, vid);
    });

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
    if (!isAdmin()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { managerId } = await req.json();

    if (!managerId) {
      return NextResponse.json({ error: "Manager ID required" }, { status: 400 });
    }

    // Remove venue assignments first
    db.prepare("DELETE FROM manager_venues WHERE manager_id = ?").run(managerId);

    // Remove user
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'manager'").run(managerId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete manager error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
