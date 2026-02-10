import type { Database } from "better-sqlite3";

export function ensureStaffingRulesExist(db: Database) {
  db.prepare(`
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
}
