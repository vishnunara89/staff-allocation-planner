import { NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";

/* =========================
   Helper: Parse CSV / XLSX Row
========================= */
function parseCSVRow(data: any, roles: any[], venues: any[]) {
  const role = roles.find(
    r => r.name.toLowerCase() === (data.primary_role || "").toLowerCase()
  );
  const roleId = role ? role.id : null;

  const venue = venues.find(
    v => v.name.toLowerCase() === (data.home_base_venue || "").toLowerCase()
  );
  const venueId = venue ? venue.id : null;

  // Phone → notes
  let notes = data.notes || "";
  if (data.phone_number) {
    const phoneEntry = `Phone:${data.phone_number}`;
    if (!notes) notes = phoneEntry;
    else if (!notes.toLowerCase().includes("phone:"))
      notes = `${notes}\n${phoneEntry}`;
  }

  return {
    full_name: data.full_name,
    primary_role_id: roleId,
    home_base_venue_id: venueId,
    secondary_roles: data.secondary_roles
      ? data.secondary_roles.split(",").map((s: string) => s.trim())
      : [],
    english_proficiency: data.english_proficiency || "basic",
    other_languages: data.other_languages
      ? data.other_languages
          .split(",")
          .reduce((acc: any, l: string) => {
            acc[l.trim()] = "fluent";
            return acc;
          }, {})
      : {},
    special_skills: data.special_skills
      ? data.special_skills.split(",").map((s: string) => s.trim())
      : [],
    experience_tags: [],
    employment_type: data.employment_type || "internal",
    availability_status: data.availability_status || "available",
    notes
  };
}

/* =========================
   POST: Bulk Import Employees
========================= */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    let rows: any[] = [];

    /* ===== Parse XLSX ===== */
    if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    }
    /* ===== Parse CSV ===== */
    else {
      const text = await file.text();
      const lines = text
        .split("\n")
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("#"));

      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV file has no data rows" },
          { status: 400 }
        );
      }

      const splitCSV = (str: string) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (const ch of str) {
          if (ch === '"') inQuotes = !inQuotes;
          else if (ch === "," && !inQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ""));
            current = "";
          } else current += ch;
        }

        result.push(current.trim().replace(/^"|"$/g, ""));
        return result;
      };

      const headers = splitCSV(lines[0]);

      for (let i = 1; i < lines.length; i++) {
        const cols = splitCSV(lines[i]);
        const row: any = {};
        headers.forEach((h, idx) => (row[h] = cols[idx] || ""));
        rows.push(row);
      }
    }

    /* ===== Lookups ===== */
    const roles = db.prepare("SELECT id, name FROM roles").all() as Array<{ id: number; name: string }>;
    const venues = db.prepare("SELECT id, name FROM venues").all() as Array<{ id: number; name: string }>;

    const insertStmt = db.prepare(`
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

    let successCount = 0;
    const details: any[] = [];

    db.transaction(() => {
      rows.forEach((row, index) => {
        const rowNum = index + 1;

        if (!row.full_name?.trim()) {
          details.push({
            row: rowNum,
            status: "error",
            message: "Missing full_name"
          });
          return;
        }

        const parsed = parseCSVRow(row, roles, venues);
        let warning: string | null = null;

        if (!parsed.primary_role_id && roles.length) {
          parsed.primary_role_id = roles[0].id;
          warning = `Role "${row.primary_role}" not found. Used default: ${roles[0].name}`;
        }

        insertStmt.run({
          ...parsed,
          secondary_roles: JSON.stringify(parsed.secondary_roles),
          other_languages: JSON.stringify(parsed.other_languages),
          special_skills: JSON.stringify(parsed.special_skills),
          experience_tags: JSON.stringify(parsed.experience_tags)
        });

        successCount++;
        details.push({
          row: rowNum,
          status: warning ? "warning" : "success",
          message: warning
        });
      });
    })();

    return NextResponse.json({
      success: true,
      imported: successCount,
      warnings: details.filter(d => d.status === "warning"),
      errors: details.filter(d => d.status === "error")
    });

  } catch (error: any) {
    console.error("[BULK IMPORT] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to import file: " + error.message },
      { status: 500 }
    );
  }
}
