import Database from "better-sqlite3";
import path from "path";
import type { Database as DatabaseType } from "better-sqlite3";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureManagerVenuesExist } from "./ensureManagerVenuesExist";

const dbPath = path.join(process.cwd(), "staff-planner.db");

// Prevent multiple DB connections in dev (Next.js hot reload safe)
const globalForDb = global as unknown as {
  sqlite?: DatabaseType;
};

let db: DatabaseType;

if (!globalForDb.sqlite) {
  try {
    const database = new Database(dbPath);

    /* =====================
       SQLITE BEST PRACTICES
    ===================== */
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");

    /* =====================
       CORE TABLES
    ===================== */

    // ✅ VENUES
    database.prepare(`
      CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        default_service_style TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    console.log("✅ venues table verified");
/* =========================
   EMPLOYEES TABLE
========================= */
database.prepare(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    primary_role_id INTEGER NOT NULL,
    home_base_venue_id INTEGER,
    notes TEXT,
    availability_status TEXT DEFAULT 'available',
    english_proficiency TEXT,
    other_languages TEXT,
    special_skills TEXT,
    employment_type TEXT,
    FOREIGN KEY (primary_role_id) REFERENCES roles(id)
  )
`).run();

    // ✅ STAFFING RULES (FIXES /api/rules ERROR)
    database.prepare(`
      CREATE TABLE IF NOT EXISTS staffing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        min_required INTEGER NOT NULL DEFAULT 0,
        max_allowed INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
      )
    `).run();
    console.log("✅ staffing_rules table verified");
/* =========================
   EMPLOYEES TABLE
========================= */
database.prepare(`
  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    primary_role_id INTEGER NOT NULL,
    home_base_venue_id INTEGER,
    notes TEXT,
    availability_status TEXT DEFAULT 'available',
    english_proficiency TEXT,
    other_languages TEXT,
    special_skills TEXT,
    employment_type TEXT,
    FOREIGN KEY (primary_role_id) REFERENCES roles(id)
  )
`).run();

    /* =====================
       OTHER TABLES
    ===================== */
    ensureUsersExist(database);
    ensurePlansExist(database);
    ensureManagerVenuesExist(database);

    globalForDb.sqlite = database;

    if (process.env.NODE_ENV === "development") {
      console.log("✅ SQLite database initialized");
    }
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

db = globalForDb.sqlite!;
export default db;
