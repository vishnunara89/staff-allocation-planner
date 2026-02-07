import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const venues = db.prepare(`SELECT COUNT(*) as c FROM venues`).get().c;
    const staff = db.prepare(`SELECT COUNT(*) as c FROM staff`).get().c;
    const availableStaff = db
      .prepare(
        `SELECT COUNT(*) as c FROM staff WHERE availability_status='available'`
      )
      .get().c;
    const events = db.prepare(`SELECT COUNT(*) as c FROM events`).get().c;
    const plans = db.prepare(`SELECT COUNT(*) as c FROM plans`).get().c;

    return NextResponse.json({
      venues,
      staff,
      availableStaff,
      events,
      plans
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
