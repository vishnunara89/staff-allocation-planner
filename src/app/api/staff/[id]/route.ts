import { NextResponse } from "next/server";
import db from "@/lib/db";

/* =========================
   SAFE JSON PARSER
========================= */
function safeJson<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    if (typeof value === "string") return JSON.parse(value);
    return value;
  } catch {
    return fallback;
  }
}

/* =========================
   NORMALIZE EMPLOYEE
========================= */
function parseEmployee(row: any) {
  return {
    ...row,
    secondary_roles: safeJson(row.secondary_roles, []),
    other_languages: safeJson(row.other_languages, {}),
    special_skills: safeJson(row.special_skills, []),
    experience_tags: safeJson(row.experience_tags, [])
  };
}

/* =========================
   GET: SINGLE EMPLOYEE
========================= */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const row = db
      .prepare("SELECT * FROM employees WHERE id = ?")
      .get(params.id);

    if (!row) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(parseEmployee(row));
  } catch (error) {
    console.error("Employee GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

/* =========================
   PUT: UPDATE EMPLOYEE
========================= */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const result = db.prepare(`
      UPDATE employees SET
        full_name = @full_name,
        primary_role_id = @primary_role_id,
        secondary_roles = @secondary_roles,
        english_proficiency = @english_proficiency,
        other_languages = @other_languages,
        special_skills = @special_skills,
        experience_tags = @experience_tags,
        home_base_venue_id = @home_base_venue_id,
        employment_type = @employment_type,
        availability_status = @availability_status,
        notes = @notes
      WHERE id = @id
    `).run({
      id: params.id,
      full_name: body.full_name,
      primary_role_id: body.primary_role_id,
      secondary_roles: JSON.stringify(body.secondary_roles || []),
      english_proficiency: body.english_proficiency || "basic",
      other_languages: JSON.stringify(body.other_languages || {}),
      special_skills: JSON.stringify(body.special_skills || []),
      experience_tags: JSON.stringify(body.experience_tags || []),
      home_base_venue_id: body.home_base_venue_id || null,
      employment_type: body.employment_type || "internal",
      availability_status: body.availability_status || "available",
      notes: body.notes || ""
    });

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee UPDATE error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: EMPLOYEE
========================= */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = db
      .prepare("DELETE FROM employees WHERE id = ?")
      .run(params.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
