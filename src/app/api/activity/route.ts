import { NextResponse } from "next/server";
import db from "@/lib/db";
import { canManageDefinitions } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        if (!canManageDefinitions()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const venueId = searchParams.get('venue_id');

        let query = "SELECT * FROM activity_log";
        let params: any[] = [];

        if (venueId) {
            query += " WHERE venue_id = ?";
            params.push(venueId);
        }

        query += " ORDER BY created_at DESC LIMIT 50";

        const logs = db.prepare(query).all(...params);

        return NextResponse.json(logs);
    } catch (err: any) {
        console.error("GET activity error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
