import type { Database } from "better-sqlite3";

export function ensureVenuesExist(db: Database) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT CHECK(type IN ('camp', 'private', 'other')) NOT NULL,
      default_service_style TEXT CHECK(default_service_style IN ('sharing', 'buffet', 'plated')) NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log("✅ venues table ensured");
}
