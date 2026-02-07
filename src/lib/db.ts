import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'staff-planner.db');

let db: any;

try {
    db = new Database(dbPath, { verbose: console.log });

    // Ensure core tables exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS venues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('camp', 'restaurant', 'private', 'other')) NOT NULL DEFAULT 'other',
            default_service_style TEXT DEFAULT 'plated',
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'Other'
        );

        CREATE TABLE IF NOT EXISTS staffing_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            department TEXT NOT NULL,
            role_id INTEGER NOT NULL,
            ratio_guests INTEGER NOT NULL,
            ratio_staff INTEGER NOT NULL DEFAULT 1,
            threshold_guests INTEGER,
            threshold_staff INTEGER,
            min_required INTEGER DEFAULT 0,
            max_allowed INTEGER,
            notes TEXT,
            FOREIGN KEY(venue_id) REFERENCES venues(id),
            FOREIGN KEY(role_id) REFERENCES roles(id)
        );

        CREATE TABLE IF NOT EXISTS manning_brackets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            department TEXT NOT NULL,
            guest_min INTEGER NOT NULL,
            guest_max INTEGER NOT NULL,
            counts_json TEXT NOT NULL,
            notes TEXT,
            source TEXT DEFAULT 'manual',
            updated_at TEXT,
            FOREIGN KEY(venue_id) REFERENCES venues(id)
        );

        CREATE TABLE IF NOT EXISTS venue_manning_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            venue_id INTEGER NOT NULL,
            department TEXT NOT NULL CHECK(department IN ('service', 'bar', 'all')),
            config_json TEXT NOT NULL,
            updated_at TEXT,
            FOREIGN KEY(venue_id) REFERENCES venues(id),
            UNIQUE(venue_id, department)
        );

        CREATE INDEX IF NOT EXISTS idx_rules_venue ON staffing_rules(venue_id);
        CREATE INDEX IF NOT EXISTS idx_brackets_venue_dept ON manning_brackets(venue_id, department);
        CREATE INDEX IF NOT EXISTS idx_manning_tables_venue ON venue_manning_tables(venue_id);
    `);
} catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
}

export default db;
