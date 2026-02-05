const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);

console.log(`Initializing database at ${dbPath}`);

const schema = `
CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    default_service_style TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT
);

CREATE TABLE IF NOT EXISTS staffing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER,
    department TEXT,
    role_id INTEGER,
    ratio_guests INTEGER,
    ratio_staff INTEGER,
    threshold_guests INTEGER,
    threshold_staff INTEGER,
    min_required INTEGER,
    max_allowed INTEGER,
    notes TEXT,
    FOREIGN KEY(venue_id) REFERENCES venues(id),
    FOREIGN KEY(role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    primary_role_id INTEGER,
    secondary_roles TEXT, -- JSON
    english_proficiency TEXT,
    other_languages TEXT, -- JSON
    special_skills TEXT, -- JSON
    experience_tags TEXT, -- JSON
    home_base_venue_id INTEGER,
    employment_type TEXT,
    availability_status TEXT,
    notes TEXT,
    FOREIGN KEY(primary_role_id) REFERENCES roles(id),
    FOREIGN KEY(home_base_venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    venue_id INTEGER,
    guest_count INTEGER,
    service_style_override TEXT,
    special_requirements TEXT,
    priority TEXT,
    start_time TEXT,
    end_time TEXT,
    FOREIGN KEY(venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS staffing_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_date TEXT,
    venue_id INTEGER,
    staff_id INTEGER,
    assigned_role_id INTEGER,
    status TEXT, -- 'proposed', 'confirmed'
    reasoning TEXT,
    FOREIGN KEY(venue_id) REFERENCES venues(id),
    FOREIGN KEY(staff_id) REFERENCES staff(id),
    FOREIGN KEY(assigned_role_id) REFERENCES roles(id)
);
`;

db.exec(schema);

// Seed initial data?
// Check if generic roles exist
const rolesCount = db.prepare('SELECT count(*) as count FROM roles').get();
if (rolesCount.count === 0) {
    console.log('Seeding initial roles...');
    const insertRole = db.prepare('INSERT INTO roles (name, category) VALUES (?, ?)');
    const roles = [
        ['Waiter', 'Service'],
        ['Runner', 'Service'],
        ['Supervisor', 'Service'],
        ['Manager', 'Management'],
        ['Bartender', 'Bar'],
        ['Barback', 'Bar'],
        ['Bar Supervisor', 'Bar'],
        ['Sommelier', 'Service'],
        ['Host', 'Service'],
        ['Cashier', 'Service']
    ];
    roles.forEach(role => insertRole.run(role));
}

console.log('Database initialized successfully.');
db.close();
