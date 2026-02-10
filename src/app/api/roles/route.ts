import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Role } from "@/types";

export async function GET() {
  try {
    const roles = db
      .prepare("SELECT id, name FROM roles ORDER BY name ASC")
      .all() as Role[];

    // ✅ MUST return array directly
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Database error (roles):", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}
