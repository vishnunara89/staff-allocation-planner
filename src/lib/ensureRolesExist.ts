import type { Database } from "better-sqlite3";

export function ensureRolesExist(db: Database) {
  // 1. Create Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // 2. ONLY seed default roles if the table is completely empty
  const count = (db.prepare("SELECT COUNT(*) as count FROM roles").get() as { count: number }).count;

  if (count === 0) {
    const roles = [
      'Event Manager', 'Assistant Manager', 'Head Chef', 'Sous Chef', 'Chef de Partie',
      'Bartender', 'Barback', 'Waiter', 'Runner', 'Host/Hostess', 'Security',
      'Cleaner', 'Dishwasher', 'Supervisor', 'Captain', 'Manager', 'Host'
    ];

    const insert = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
    const insertMany = db.transaction((roles: string[]) => {
      for (const role of roles) insert.run(role);
    });

    insertMany(roles);
    console.log("🌱 Seeded default roles (table was empty)");
  }

  console.log("✅ roles table verified");
}
