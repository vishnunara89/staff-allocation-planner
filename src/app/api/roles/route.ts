import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";
import type { Role } from "@/types";

/* =========================
   GET – List All Roles
========================= */
export async function GET() {
  try {
    const roles = db
      .prepare("SELECT id, name FROM roles ORDER BY name ASC")
      .all() as Role[];

    // ✅ Return array directly (important for dropdowns)
    return NextResponse.json(roles);

  } catch (error) {
    console.error("Database error (roles GET):", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}


/* =========================
   POST – Create Role (Admin Only)
========================= */
export async function POST(req: Request) {
  try {
    // 🔐 Admin check
    if (!isAdmin()) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const roleName = body?.name?.trim();

    if (!roleName) {
      return NextResponse.json(
        { error: "Role name required" },
        { status: 400 }
      );
    }

    // Insert role
    db.prepare("INSERT INTO roles (name) VALUES (?)").run(roleName);

    return NextResponse.json(
      { success: true, message: "Role created successfully" },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Database error (roles POST):", err);

    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
