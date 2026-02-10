import type { Database } from "better-sqlite3";

export function ensureManagerVenuesExist(db: Database) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS manager_venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL,
      venue_id INTEGER,
      venue_name TEXT, 
      UNIQUE(manager_id, venue_id),
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    )
  `).run();

  // Migration: If venue_id doesn't exist, try to add it
  try {
    db.prepare("ALTER TABLE manager_venues ADD COLUMN venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE").run();
    console.log("✅ Added venue_id to manager_venues");
  } catch (e) {
    // Column already exists or table doesn't exist yet
  }

  console.log("✅ manager_venues table verified");
}
