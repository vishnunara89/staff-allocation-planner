import type { Database } from "better-sqlite3";

export function ensureEventsExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      venue_id INTEGER NOT NULL,
      guest_count INTEGER NOT NULL,
      service_style_override TEXT,
      special_requirements TEXT,
      priority TEXT DEFAULT 'normal',
      start_time TEXT,
      end_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    )
  `).run();

    console.log("✅ events table verified");
}
