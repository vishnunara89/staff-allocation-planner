import { NextResponse } from "next/server";
import db from "@/lib/db";
import { StaffMember, CreateStaffDTO } from "@/types";

/* =========================
   Helper: Parse JSON fields
========================= */
function parseStaff(row: any): StaffMember {
  return {
    ...row,
    secondary_roles: row.secondary_roles ? JSON.parse(row.secondary_roles) : [],
    other_languages: row.other_languages ? JSON.parse(row.other_languages) : {},
    special_skills: row.special_skills ? JSON.parse(row.special_skills) : [],
    experience_tags: row.experience_tags ? JSON.parse(row.experience_tags) : []
  };
}

/* =========================
   GET: Fetch Staff
========================= */
export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT 
        s.*,
        r.name AS primary_role_name,
        v.name AS home_venue_name
      FROM staff s
      LEFT JOIN roles r ON s.primary_role_id = r.id
      LEFT JOIN venues v ON s.home_base_venue_id = v.id
      ORDER BY s.full_name ASC
    `).all();

    const staff = rows.map(parseStaff);

    // ✅ Return pure array
    return NextResponse.json(staff);
  } catch (error) {
    console.error("Database error (staff GET):", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

/* =========================
   POST: Create Staff
========================= */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateStaffDTO;

    // ✅ Required validation
    if (!body.full_name?.trim() || !body.primary_role_id) {
      return NextResponse.json(
        { error: "Full Name and Primary Role are required" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO staff (
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
      english_proficiency: body.english_proficiency || "medium",
      other_languages: JSON.stringify(body.other_languages || {}),
      special_skills: JSON.stringify(body.special_skills || []),
      experience_tags: JSON.stringify(body.experience_tags || []),
      home_base_venue_id: body.home_base_venue_id ?? null,
      employment_type: body.employment_type || "internal",
      availability_status: body.availability_status || "available",
      notes: body.notes || ""
    });

    // ✅ Return created staff in same shape as GET
    const newStaff = db.prepare(`
      SELECT 
        s.*,
        r.name AS primary_role_name,
        v.name AS home_venue_name
      FROM staff s
      LEFT JOIN roles r ON s.primary_role_id = r.id
      LEFT JOIN venues v ON s.home_base_venue_id = v.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(parseStaff(newStaff), { status: 201 });

  } catch (error) {
    console.error("Database error (staff POST):", error);
    return NextResponse.json(
      { error: "Failed to create staff member" },
      { status: 500 }
    );
  }
}
