import Database from "better-sqlite3";
import path from "path";
import type { Database as DatabaseType } from "better-sqlite3";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureEventsExist } from "./ensureEventsExist";
import { ensureRolesExist } from "./ensureRolesExist";
import { ensureStaffExist } from "./ensureStaffExist";
import { ensureStaffingPlansExist } from "./ensureStaffingPlansExist";
import { ensureManningTablesExist } from "./ensureManningTablesExist";
import { ensureManningBracketsExist } from "./ensureManningBracketsExist";
import { ensureRequirementsCatalogExist } from "./ensureRequirementsCatalogExist";
import { ensureVenuesExist } from "./ensureVenuesExist";

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
    database
      .prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
      .run();
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
       SKILLS  (NEW TABLE ADDED)
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `).run();

    /* =========================
       VENUES
    ========================= */
    ensureVenuesExist(database);

    /* =========================
       USERS
    ========================= */
    ensureUsersExist(database);

    /* =========================
       MANAGER ↔ VENUES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS manager_venues (
        manager_id INTEGER NOT NULL,
        venue_id INTEGER NOT NULL,
        PRIMARY KEY (manager_id, venue_id),
        FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
      )
    `).run();
    addColumnIfMissing(database, "manager_venues", "venue_name", "TEXT");

    /* =========================
       EMPLOYEES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        primary_role_id INTEGER NOT NULL,
        home_base_venue_id INTEGER,
        employment_type TEXT DEFAULT 'internal',
        availability_status TEXT DEFAULT 'available',
        english_proficiency TEXT DEFAULT 'basic',
        notes TEXT,
        employee_role TEXT DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (primary_role_id) REFERENCES roles(id),
        FOREIGN KEY (home_base_venue_id) REFERENCES venues(id)
      )
    `).run();

    /* =========================
       EMPLOYEE AUTO-MIGRATIONS
    ========================= */
    addColumnIfMissing(database, "employees", "secondary_roles", "TEXT DEFAULT '[]'");
    addColumnIfMissing(database, "employees", "other_languages", "TEXT DEFAULT '{}'");
    addColumnIfMissing(database, "employees", "special_skills", "TEXT DEFAULT '[]'");
    addColumnIfMissing(database, "employees", "experience_tags", "TEXT DEFAULT '[]'");
    addColumnIfMissing(database, "employees", "employee_role", "TEXT DEFAULT 'staff'");
    addColumnIfMissing(database, "employees", "phone", "TEXT DEFAULT ''");
    addColumnIfMissing(database, "employees", "current_event_id", "INTEGER");
    addColumnIfMissing(database, "employees", "working_hours", "REAL DEFAULT 0");

    /* =========================
       STAFFING RULES
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS staffing_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        venue_id INTEGER NOT NULL,
        department TEXT DEFAULT 'service',
        role_id INTEGER NOT NULL,
        ratio_guests INTEGER DEFAULT 0,
        ratio_staff INTEGER DEFAULT 0,
        threshold_guests INTEGER,
        threshold_staff INTEGER,
        min_required INTEGER NOT NULL DEFAULT 0,
        max_allowed INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `).run();

    /* =========================
       EVENTS AUTO-MIGRATIONS
    ========================= */
    addColumnIfMissing(database, "events", "event_name", "TEXT");

    /* =========================
       ACTIVITY LOG (NEW)
    ========================= */
    database.prepare(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT,
        venue_id INTEGER,
        venue_name TEXT,
        action_type TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    /* =========================
       SEEDS & OTHER TABLES
    ========================= */
    ensureRolesExist(database);
    ensureStaffExist(database);
    ensurePlansExist(database);
    ensureEventsExist(database);
    ensureStaffingPlansExist(database);
    ensureManningTablesExist(database);
    ensureManningBracketsExist(database);
    ensureRequirementsCatalogExist(database);

    globalForDb.sqlite = database;

    console.log("✅ SQLite database initialized & migrated successfully");
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    throw error;
  }
}

db = globalForDb.sqlite!;
export default db;
