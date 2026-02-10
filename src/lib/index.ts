import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import path from "path";

import { ensureUsersExist } from "./ensureUsersExist";
import { ensurePlansExist } from "./ensurePlansExist";
import { ensureVenuesExist } from "./ensureVenuesExist";

const dbPath = path.join(process.cwd(), "staff-planner.db");

const globalForDb = global as unknown as {
  sqlite?: DatabaseType;
};

let db: DatabaseType;

if (!globalForDb.sqlite) {
  const database = new Database(dbPath);

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  // ✅ ENSURE ALL TABLES
  ensureUsersExist(database);
  ensurePlansExist(database);
  ensureVenuesExist(database); // 👈 THIS FIXES YOUR ERROR

  globalForDb.sqlite = database;
  console.log("✅ SQLite database initialized");
}

db = globalForDb.sqlite!;
export default db;
