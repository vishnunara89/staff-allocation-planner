import { NextResponse } from "next/server";
import db from "@/lib/db";
import { StaffMember, CreateStaffDTO } from "@/types";

/* =========================
   Helper: Parse JSON Fields
========================= */
function parseEmployee(row: any): StaffMember {
  return {
    ...row,
    secondary_roles: row.secondary_roles ? JSON.parse(row.secondary_roles) : [],
    other_languages: row.other_languages ? JSON.parse(row.other_languages) : {},
    special_skills: row.special_skills ? JSON.parse(row.special_skills) : [],
    experience_tags: row.experience_tags ? JSON.parse(row.experience_tags) : []
  };
}

/* =========================
   GET: All Employees
========================= */
export async function GET() {
  try {
    const stmt = db.prepare(`
      SELECT e.*, r.name AS primary_role_name, v.name AS home_venue_name
      FROM employees e
      LEFT JOIN roles r ON e.primary_role_id = r.id
      LEFT JOIN venues v ON e.home_base_venue_id = v.id
      ORDER BY e.full_name ASC
    `);

    const rows = stmt.all();
    const employees = rows.map(parseEmployee);

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Database error (employees GET):", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: Create Employee
========================= */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateStaffDTO;

    if (!body.full_name || !body.primary_role_id) {
      return NextResponse.json(
        { error: "Name and primary role are required" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO employees (
        full_name,
        primary_role_id,
        secondary_roles,
        english_proficiency,
        other_languages,
        special_skills,
        experience_tags,
        home_base_venue_id,
        employment_type,
        availability_status,
        notes
      ) VALUES (
        @full_name,
        @primary_role_id,
        @secondary_roles,
        @english_proficiency,
        @other_languages,
        @special_skills,
        @experience_tags,
        @home_base_venue_id,
        @employment_type,
        @availability_status,
        @notes
      )
    `);

    const result = stmt.run({
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

    return NextResponse.json(
      { id: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database error (employees POST):", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
