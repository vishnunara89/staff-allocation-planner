import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import path from "path";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureManagerVenuesExist } from "./ensureManagerVenuesExist";

const dbPath = path.join(process.cwd(), "staff-planner.db");

// Prevent multiple DB connections in dev (Next.js hot reload)
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
       ENSURE TABLES EXIST
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
