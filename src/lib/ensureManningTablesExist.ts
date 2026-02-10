import type { Database } from "better-sqlite3";

export function ensureManningTablesExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS venue_manning_tables (
      venue_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      config_json TEXT,
      updated_at TEXT,
      PRIMARY KEY (venue_id, department),
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    )
  `).run();

    console.log("✅ venue_manning_tables table verified");
}
