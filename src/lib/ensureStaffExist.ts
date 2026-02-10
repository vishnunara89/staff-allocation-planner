import type { Database } from "better-sqlite3";

export function ensureStaffExist(db: Database) {
    db.prepare(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      primary_role_id INTEGER,
      secondary_roles TEXT, -- JSON array of role IDs
      english_proficiency TEXT DEFAULT 'basic',
      other_languages TEXT, -- JSON object { language: proficiency }
      special_skills TEXT, -- JSON array of strings
      experience_tags TEXT, -- JSON array of strings
      home_base_venue_id INTEGER,
      employment_type TEXT DEFAULT 'internal', -- internal, freelance, agency
      availability_status TEXT DEFAULT 'available', -- available, off, leave
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (primary_role_id) REFERENCES roles(id) ON DELETE SET NULL,
      FOREIGN KEY (home_base_venue_id) REFERENCES venues(id) ON DELETE SET NULL
    )
  `).run();

    console.log("✅ staff table verified");
}
