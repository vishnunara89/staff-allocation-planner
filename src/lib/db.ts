import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "staff-planner.db");

// Prevent multiple DB instances in dev (Next.js hot reload)
const globalForDb = global as unknown as {
  sqlite?: DatabaseType;
};

let db: DatabaseType;

try {
  if (!globalForDb.sqlite) {
    const database = new Database(dbPath, {
      verbose:
        process.env.NODE_ENV === "development" ? console.log : undefined,
    });

    // Recommended SQLite settings
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");

    globalForDb.sqlite = database;
  }

  db = globalForDb.sqlite!;
} catch (error) {
  console.error("❌ Failed to connect to SQLite database:", error);
  throw error;
}

export default db;
