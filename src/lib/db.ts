import Database from "better-sqlite3";
import path from "path";
import type { Database as DatabaseType } from "better-sqlite3";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureManagerVenuesExist } from "./ensureManagerVenuesExist";
import { ensureEventsExist } from "./ensureEventsExist";
import { ensureRolesExist } from "./ensureRolesExist";
import { ensureStaffExist } from "./ensureStaffExist";
import { ensureStaffingPlansExist } from "./ensureStaffingPlansExist";
import { ensureManningTablesExist } from "./ensureManningTablesExist";
import { ensureManningBracketsExist } from "./ensureManningBracketsExist";
import { ensureRequirementsCatalogExist } from "./ensureRequirementsCatalogExist";
import { ensureVenuesExist } from "./ensureVenuesExist";

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

    // ✅ VENUES (handled by ensureVenuesExist to include seeding)
    ensureVenuesExist(database);

    // ✅ STAFFING RULES (full schema with ratio + threshold columns)
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

        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
      )
    `).run();

    // Migration: add missing columns to existing staffing_rules tables
    const columnsToAdd = [
      { name: 'department', sql: "ALTER TABLE staffing_rules ADD COLUMN department TEXT DEFAULT 'service'" },
      { name: 'ratio_guests', sql: "ALTER TABLE staffing_rules ADD COLUMN ratio_guests INTEGER DEFAULT 0" },
      { name: 'ratio_staff', sql: "ALTER TABLE staffing_rules ADD COLUMN ratio_staff INTEGER DEFAULT 0" },
      { name: 'threshold_guests', sql: "ALTER TABLE staffing_rules ADD COLUMN threshold_guests INTEGER" },
      { name: 'threshold_staff', sql: "ALTER TABLE staffing_rules ADD COLUMN threshold_staff INTEGER" },
    ];
    for (const col of columnsToAdd) {
      try { database.prepare(col.sql).run(); } catch { /* column already exists */ }
    }
    console.log("✅ staffing_rules table verified (full schema)");

    /* =====================
       OTHER TABLES
    ===================== */
    ensureUsersExist(database);
    ensurePlansExist(database);
    ensureManagerVenuesExist(database);
    ensureEventsExist(database);
    ensureRolesExist(database);
    ensureStaffExist(database);
    ensureStaffingPlansExist(database);
    ensureManningTablesExist(database);
    ensureManningBracketsExist(database);
    ensureRequirementsCatalogExist(database);

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
