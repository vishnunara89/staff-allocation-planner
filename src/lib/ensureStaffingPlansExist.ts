import type { Database } from "better-sqlite3";

export function ensureStaffingPlansExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS staffing_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date TEXT NOT NULL,
      venue_id INTEGER NOT NULL,
      staff_id INTEGER,
      assigned_role_id INTEGER,
      status TEXT DEFAULT 'proposed',
      reasoning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_role_id) REFERENCES roles(id) ON DELETE SET NULL
    )
  `).run();

    // Performance index
    const indexExists = db.prepare(
        "SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_staffing_plans_date'"
    ).get();
    if (!indexExists) {
        db.prepare("CREATE INDEX idx_staffing_plans_date ON staffing_plans(event_date)").run();
    }

    console.log("✅ staffing_plans table verified");
}
