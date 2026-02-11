import type { Database } from "better-sqlite3";
import bcrypt from "bcryptjs";

export function ensureUsersExist(db: Database) {

  /* =========================
     ROLES TABLE
  ========================= */
  db.prepare(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `).run();

  /* =========================
     USERS TABLE
  ========================= */
  // Note: The users table uses a TEXT 'role' with a CHECK constraint rather than a foreign key to roles table.
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager')) NOT NULL
    )
  `).run();

  /* =========================
     DEFAULT ADMIN
  ========================= */
  const admin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!admin) {
    const hashedAdminPassword = bcrypt.hashSync("admin123", 10);

    db.prepare(`
      INSERT INTO users (name, phone, username, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "System Admin",
      "0000000000",
      "admin",
      hashedAdminPassword,
      "admin"
    );

    console.log("✅ Default admin created (admin / admin123)");
  }

  /* =========================
     DEFAULT MANAGER
  ========================= */
  const manager = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("manager");

  if (!manager) {
    const hashedManagerPassword = bcrypt.hashSync("manager123", 10);

    db.prepare(`
      INSERT INTO users (name, phone, username, password, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "Default Manager",
      "9999999999",
      "manager",
      hashedManagerPassword,
      "manager"
    );

    console.log("✅ Default manager created (manager / manager123)");
  }

  console.log("✅ users & roles tables verified");
}
