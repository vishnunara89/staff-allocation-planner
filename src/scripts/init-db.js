const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'staff-planner.db');

// Safe: no longer deletes existing data

const db = new Database(dbPath);

console.log(`Initializing COMPREHENSIVE database at ${dbPath}`);

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

CREATE TABLE IF NOT EXISTS venue_manning_tables (
    venue_id INTEGER,
    department TEXT,
    config_json TEXT, -- JSON
    updated_at TEXT,
    PRIMARY KEY (venue_id, department),
    FOREIGN KEY(venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS manning_brackets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venue_id INTEGER,
    department TEXT,
    guest_min INTEGER,
    guest_max INTEGER,
    counts_json TEXT, -- JSON
    notes TEXT,
    source TEXT,
    updated_at TEXT,
    FOREIGN KEY(venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS requirements_catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'skill', 'language', 'other'
    value TEXT NOT NULL
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_staffing_plans_date ON staffing_plans(event_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
`;

db.exec(schema);

// --- SEED INITIAL DATA ---

// 1. Roles (idempotent)
console.log('Seeding initial roles...');
const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name, category) VALUES (?, ?)');
const roles = [
    ['Waiter', 'Service'],
    ['Runner', 'Service'],
    ['Head Waiter', 'Service'],
    ['Manager', 'Management'],
    ['Assistant Manager', 'Management'],
    ['Bartender', 'Bar'],
    ['Barback', 'Bar'],
    ['Head Bartender', 'Bar'],
    ['Bar Supervisor', 'Bar'],
    ['Supervisor', 'Service'],
    ['Sommelier', 'Service'],
    ['Host', 'Service'],
    ['Cashier', 'Service'],
    ['Busser', 'Service'],
    ['Shisha Operator', 'Service'],
    ['Housekeeper', 'Other'],
    ['Stewarding', 'Other']
];
roles.forEach(role => insertRole.run(role));

// 2. Venues (idempotent)
console.log('Seeding initial venues...');
const insertVenue = db.prepare('INSERT OR IGNORE INTO venues (name, type, default_service_style) VALUES (?, ?, ?)');
const venues = [
    ['SONARA', 'camp', 'sharing'],
    ['NEST', 'camp', 'buffet'],
    ['LADY NARA', 'private', 'set_menu']
];
venues.forEach(v => insertVenue.run(v));

// 3. Requirements Catalog (idempotent)
console.log('Seeding requirements catalog...');
const insertReq = db.prepare('INSERT OR IGNORE INTO requirements_catalog (type, value) VALUES (?, ?)');
const standardReqs = [
    ['language', 'Arabic'],
    ['language', 'French'],
    ['language', 'Russian'],
    ['skill', 'Wine Service'],
    ['skill', 'Silver Service'],
    ['skill', 'Cocktail Making']
];
standardReqs.forEach(r => insertReq.run(r));

console.log('✅ Database fully initialized with comprehensive schema and seeds.');
db.close();
