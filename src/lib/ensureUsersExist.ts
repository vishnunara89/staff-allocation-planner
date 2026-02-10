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

  // Seed roles
  const roles = ["admin", "manager"];

  for (const role of roles) {
    db.prepare(
      "INSERT OR IGNORE INTO roles (name) VALUES (?)"
    ).run(role);
  }

  /* =========================
     USERS TABLE
  ========================= */
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `).run();

  /* =========================
     DEFAULT ADMIN
  ========================= */
  const admin = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!admin) {
    const adminRole = db
      .prepare("SELECT id FROM roles WHERE name = ?")
      .get("admin") as { id: number };

    const hashedAdminPassword = bcrypt.hashSync("admin123", 10);

    db.prepare(`
      INSERT INTO users (name, phone, username, password, role_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "System Admin",
      "0000000000",
      "admin",
      hashedAdminPassword,
      adminRole.id
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
    const managerRole = db
      .prepare("SELECT id FROM roles WHERE name = ?")
      .get("manager") as { id: number };

    const hashedManagerPassword = bcrypt.hashSync("manager123", 10);

    db.prepare(`
      INSERT INTO users (name, phone, username, password, role_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "Default Manager",
      "9999999999",
      "manager",
      hashedManagerPassword,
      managerRole.id
    );

    console.log("✅ Default manager created (manager / manager123)");
  }

  console.log("✅ users & roles tables verified");
}
