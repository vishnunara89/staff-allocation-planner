import { NextResponse } from "next/server";
import db from "@/lib/db";
import { StaffMember, CreateStaffDTO } from "@/types";

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
function parseEmployee(row: any): StaffMember {
  return {
    ...row,
    secondary_roles: safeJson(row.secondary_roles, []),
    other_languages: safeJson(row.other_languages, {}),
    special_skills: safeJson(row.special_skills, []),
    experience_tags: safeJson(row.experience_tags, []),
    employee_role: row.employee_role || "staff" // ✅ NEW
  };
}

/* =========================
   GET: EMPLOYEES
========================= */
export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT 
        e.*,
        r.name AS primary_role_name,
        v.name AS home_venue_name
      FROM employees e
      LEFT JOIN roles r ON e.primary_role_id = r.id
      LEFT JOIN venues v ON e.home_base_venue_id = v.id
      ORDER BY e.full_name ASC
    `).all();

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
   POST: ADD EMPLOYEE
========================= */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateStaffDTO & {
      employee_role?: "admin" | "manager" | "staff";
    };

    if (!body.full_name || !body.primary_role_id) {
      return NextResponse.json(
        { error: "Name and primary role are required" },
        { status: 400 }
      );
    }

    const result = db.prepare(`
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
        notes,
        employee_role
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
        @notes,
        @employee_role
      )
    `).run({
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
      notes: body.notes || "",
      employee_role: body.employee_role || "staff" // ✅ DEFAULT
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
