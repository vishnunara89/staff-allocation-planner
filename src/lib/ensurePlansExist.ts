import type { Database } from "better-sqlite3";

export function ensurePlansExist(db: Database) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT CHECK(status IN ('active', 'inactive')) 
        NOT NULL DEFAULT 'inactive',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
