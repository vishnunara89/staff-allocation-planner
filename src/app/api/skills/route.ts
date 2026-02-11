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

// DELETE SKILL (ADMIN ONLY)
export async function DELETE(req: Request) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Skill ID required" }, { status: 400 });
        }

        // 1. Get skill name
        const skill = db.prepare("SELECT name FROM skills WHERE id = ?").get(id) as { name: string } | undefined;
        if (!skill) {
            return NextResponse.json({ error: "Skill not found" }, { status: 404 });
        }

        const skillName = skill.name;

        // 2. Transactional cleanup
        const deleteTransaction = db.transaction(() => {
            // Remove from employees.special_skills (stored as JSON array of strings)
            const employees = db.prepare("SELECT id, special_skills FROM employees").all() as { id: number, special_skills: string }[];

            for (const emp of employees) {
                let skills: string[] = [];
                try {
                    skills = JSON.parse(emp.special_skills || "[]");
                } catch {
                    skills = [];
                }

                if (skills.includes(skillName)) {
                    const updated = skills.filter(s => s !== skillName);
                    db.prepare("UPDATE employees SET special_skills = ? WHERE id = ?").run(JSON.stringify(updated), emp.id);
                }
            }

            // 3. Delete the skill record
            db.prepare("DELETE FROM skills WHERE id = ?").run(id);
        });

        deleteTransaction();

        return NextResponse.json({ success: true, message: "Skill deleted and staff profiles updated" });
    } catch (error) {
        console.error("Database error (skills DELETE):", error);
        return NextResponse.json({ error: "Failed to delete skill: " + (error as Error).message }, { status: 500 });
    }
}
