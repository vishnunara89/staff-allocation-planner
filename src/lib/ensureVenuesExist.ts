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

  // 2. Ensure Default Venues
  const venues = [
    { name: 'SONARA', type: 'camp', default_service_style: 'sharing' },
    { name: 'NEST', type: 'camp', default_service_style: 'sharing' },
    { name: 'LADY NARA', type: 'other', default_service_style: 'plated' }
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO venues (name, type, default_service_style) 
    VALUES (@name, @type, @default_service_style)
  `);

  const insertMany = db.transaction((venues: any[]) => {
    for (const venue of venues) insert.run(venue);
  });

  insertMany(venues);
  console.log("✅ venues table ensured");
}
