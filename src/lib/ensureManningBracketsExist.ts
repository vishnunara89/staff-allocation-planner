import type { Database } from "better-sqlite3";

export function ensureManningBracketsExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS manning_brackets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venue_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      guest_min INTEGER NOT NULL,
      guest_max INTEGER NOT NULL,
      counts_json TEXT,
      notes TEXT,
      source TEXT DEFAULT 'manual',
      updated_at TEXT,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    )
  `).run();

    console.log("✅ manning_brackets table verified");
}
