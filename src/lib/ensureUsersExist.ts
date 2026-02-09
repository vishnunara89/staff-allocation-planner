import type { Database } from "better-sqlite3";

export function ensureUsersExist(db: Database) {
  // ✅ CREATE TABLE
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager')) NOT NULL
    )
  `).run();

  // ✅ DEFAULT ADMIN
  const admin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!admin) {
    db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    ).run("admin", "admin123", "admin");

    console.log("✅ Default admin created");
  }

  // ✅ DEFAULT MANAGER
  const manager = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("manager");

  if (!manager) {
    db.prepare(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)"
    ).run("manager", "manager123", "manager");

    console.log("✅ Default manager created");
  }
}
