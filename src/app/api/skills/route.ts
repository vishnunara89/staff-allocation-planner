import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";

// GET ALL SKILLS
export async function GET() {
    try {
        const skills = db.prepare("SELECT * FROM skills ORDER BY name ASC").all();
        return NextResponse.json(skills);
    } catch {
        return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
    }
}

// CREATE SKILL (ADMIN ONLY)
export async function POST(req: Request) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        if (!body.name?.trim()) {
            return NextResponse.json({ error: "Skill name required" }, { status: 400 });
        }

        db.prepare("INSERT INTO skills (name) VALUES (?)").run(body.name.trim());

        return NextResponse.json({ success: true });
    } catch (err: any) {
        if (err.message.includes("UNIQUE")) {
            return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create skill" }, { status: 500 });
    }
}
