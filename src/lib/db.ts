import Database from "better-sqlite3";
import path from "path";
import type { Database as DatabaseType } from "better-sqlite3";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureManagerVenuesExist } from "./ensureManagerVenuesExist";

const dbPath = path.join(process.cwd(), "staff-planner.db");

const globalForDb = global as unknown as {
  sqlite?: DatabaseType;
};

let db: DatabaseType;

/* =========================
   HELPER: ADD COLUMN IF MISSING
========================= */
function addColumnIfMissing(
  database: DatabaseType,
  table: string,
  column: string,
  definition: string
) {
  const columns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((c: any) => c.name);

  if (!columns.includes(column)) {
    database.prepare(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    ).run();
    console.log(`➕ Added column ${column} to ${table}`);
  }
}

if (!globalForDb.sqlite) {
  try {
    const database = new Database(dbPath);

    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");

    /* =========================
       ROLES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `).run();

    /* =========================
       VENUES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS venues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        default_service_style TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    /* =========================
       EMPLOYEES (BASE TABLE)
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        primary_role_id INTEGER NOT NULL,
        home_base_venue_id INTEGER,
        employment_type TEXT,
        availability_status TEXT DEFAULT 'available',
        english_proficiency TEXT,
        notes TEXT,
        FOREIGN KEY (primary_role_id) REFERENCES roles(id),
        FOREIGN KEY (home_base_venue_id) REFERENCES venues(id)
      )
    `).run();

    /* =========================
       EMPLOYEES AUTO-MIGRATION
    ========================= */
    addColumnIfMissing(database, "employees", "secondary_roles", "TEXT DEFAULT '[]'");
    addColumnIfMissing(database, "employees", "other_languages", "TEXT DEFAULT '{}'");
    addColumnIfMissing(database, "employees", "special_skills", "TEXT DEFAULT '[]'");
    addColumnIfMissing(database, "employees", "experience_tags", "TEXT DEFAULT '[]'");

    /* =========================
       STAFFING RULES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS staffing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        min_required INTEGER NOT NULL DEFAULT 0,
        max_allowed INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `).run();

    /* =========================
       SEED & OTHER TABLES
    ========================= */
    ensureUsersExist(database);
    ensurePlansExist(database);
    ensureManagerVenuesExist(database);

    globalForDb.sqlite = database;

    console.log("✅ SQLite database initialized & migrated");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

db = globalForDb.sqlite!;
export default db;
