import type { Database } from "better-sqlite3";

export function ensureManagerVenuesExist(db: Database) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS manager_venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL,
      venue_name TEXT NOT NULL,
      UNIQUE(manager_id, venue_name),
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  console.log("✅ manager_venues table verified");
}
