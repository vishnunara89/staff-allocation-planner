import { NextResponse } from "next/server";
import db from "@/lib/db";

/* ---------------- SAFE JSON PARSE ---------------- */
function safeParse<T>(value: any, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/* ======================
   GET /api/requirements
====================== */
export async function GET() {
  try {
    /* ---------- TABLE SAFETY CHECK ---------- */
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='requirements_catalog'`
      )
      .get();

    const catalog: { type: string; value: string }[] = tableExists
      ? (db
          .prepare(`SELECT type, value FROM requirements_catalog`)
          .all() as any[])
      : [];

    /* ---------- STAFF DATA ---------- */
    const staffRows = db
      .prepare(`
        SELECT 
          other_languages,
          special_skills,
          english_proficiency,
          availability_status
        FROM staff
      `)
      .all() as any[];

    const staffLanguages = new Set<string>();
    const staffSkills = new Set<string>();

    /* ---------- COLLECT STAFF SKILLS & LANGUAGES ---------- */
    staffRows.forEach(row => {
      const languages = safeParse<Record<string, any>>(
        row.other_languages,
        {}
      );
      Object.keys(languages).forEach(l => staffLanguages.add(l));

      const skills = safeParse<string[]>(row.special_skills, []);
      skills.forEach(s => staffSkills.add(s));
    });

    /* ---------- MERGE OPTIONS ---------- */
    const options: any[] = [];

    // Catalog first
    catalog.forEach(c =>
      options.push({
        type: c.type,
        value: c.value,
        source: "catalog",
        available_internal: 0
      })
    );

    // Staff languages
    staffLanguages.forEach(lang => {
      if (
        !options.find(
          o =>
            o.type === "language" &&
            o.value.toLowerCase() === lang.toLowerCase()
        )
      ) {
        options.push({
          type: "language",
          value: lang,
          source: "staff",
          available_internal: 0
        });
      }
    });

    // Staff skills
    staffSkills.forEach(skill => {
      if (
        !options.find(
          o =>
            o.type === "skill" &&
            o.value.toLowerCase() === skill.toLowerCase()
        )
      ) {
        options.push({
          type: "skill",
          value: skill,
          source: "staff",
          available_internal: 0
        });
      }
    });

    /* ---------- CALCULATE AVAILABLE INTERNAL STAFF ---------- */
    options.forEach(opt => {
      let count = 0;

      staffRows.forEach(row => {
        if ((row.availability_status ?? "available") !== "available") return;

        if (opt.type === "language") {
          const langs = safeParse<Record<string, any>>(
            row.other_languages,
            {}
          );
          if (langs[opt.value]) count++;
        }

        if (opt.type === "skill") {
          const skills = safeParse<string[]>(row.special_skills, []);
          if (skills.includes(opt.value)) count++;
        }
      });

      opt.available_internal = count;
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Requirements API error:", error);
    // 🔒 NEVER break frontend
    return NextResponse.json([]);
  }
}

/* ======================
   POST /api/requirements
====================== */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.type || !body?.value) {
      return NextResponse.json(
        { error: "Type and Value required" },
        { status: 400 }
      );
    }

    const stmt = db.prepare(`
      INSERT INTO requirements_catalog (type, value)
      VALUES (@type, @value)
    `);

    const result = stmt.run({
      type: body.type,
      value: body.value
    });

    return NextResponse.json({
      id: result.lastInsertRowid,
      type: body.type,
      value: body.value,
      source: "catalog",
      available_internal: 0
    });
  } catch (error) {
    console.error("Requirements POST error:", error);
    return NextResponse.json(
      { error: "Failed to add requirement" },
      { status: 500 }
    );
  }
}
