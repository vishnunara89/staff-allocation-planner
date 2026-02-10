const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);

console.log('--- SEEDING PHASE 7 TEST DATA ---');

// 1. Clean up potential old test data (optional but recommended for deterministic tests)
// We'll use specific names/IDs to avoid clashing with real data if possible, 
// but for a clean test we'll just add new ones.

try {
    // 1. Create Venues
    const insertVenue = db.prepare('INSERT OR IGNORE INTO venues (name, type, default_service_style) VALUES (?, ?, ?)');
    const getVenueId = db.prepare('SELECT id FROM venues WHERE name = ?');

    function getOrCreateVenue(name, type, style) {
        insertVenue.run(name, type, style);
        return getVenueId.get(name).id;
    }

    const vA = getOrCreateVenue('Venue A (Brackets)', 'restaurant', 'plated');
    const vB = getOrCreateVenue('Venue B (Ratios)', 'camp', 'sharing');
    const vC = getOrCreateVenue('Venue C (No Rules)', 'other', 'cocktail');

    console.log(`Created Venues: A(${vA}), B(${vB}), C(${vC})`);

    // 2. Roles (Ensure we have IDs for Waiter and Manager)
    // We assume roles from init-db.js exist: Waiter, Manager
    const roles = db.prepare("SELECT id, name FROM roles WHERE name IN ('Waiter', 'Manager')").all();
    const waiterId = roles.find(r => r.name === 'Waiter').id;
    const managerId = roles.find(r => r.name === 'Manager').id;

    // 3. Venue A Brackets (50-100: 2W/1M, 101-200: 4W/2M)
    const insertBracket = db.prepare(`
        INSERT OR IGNORE INTO manning_brackets (venue_id, department, guest_min, guest_max, counts_json) 
        VALUES (?, ?, ?, ?, ?)
    `);

    insertBracket.run(vA, 'service', 50, 100, JSON.stringify({ [waiterId]: 2, [managerId]: 1 }));
    insertBracket.run(vA, 'service', 101, 200, JSON.stringify({ [waiterId]: 4, [managerId]: 2 }));

    // 4. Venue B Ratio Rules (1 Waiter per 10 guests. Min 1 Manager.)
    const insertRule = db.prepare(`
        INSERT OR IGNORE INTO staffing_rules (venue_id, department, role_id, ratio_guests, ratio_staff, min_required)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertRule.run(vB, 'service', waiterId, 10, 1, 0); // 1:10 Ratio
    insertRule.run(vB, 'service', managerId, 0, 0, 1);  // Min 1 Manager

    // 5. Staff
    const insertStaff = db.prepare(`
        INSERT OR IGNORE INTO staff (full_name, primary_role_id, secondary_roles, home_base_venue_id, employment_type, availability_status)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Home Base Venue A
    insertStaff.run('Alice (A-Home)', waiterId, '[]', vA, 'internal', 'available');
    insertStaff.run('Bob (A-Home)', waiterId, '[]', vA, 'internal', 'available');

    // Home Base Venue B
    insertStaff.run('Charlie (B-Home)', waiterId, '[]', vB, 'internal', 'available');

    // Management
    insertStaff.run('Dave (Manager)', managerId, '[]', vA, 'internal', 'available');

    // Unavailable
    insertStaff.run('Eve (Off)', waiterId, '[]', vA, 'internal', 'off');

    // 6. Events
    const insertEvent = db.prepare(`
        INSERT OR IGNORE INTO events (date, venue_id, guest_count, priority, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const testDate = '2026-03-01';
    insertEvent.run(testDate, vA, 75, 'normal', '18:00', '22:00');  // Should match bracket 1
    insertEvent.run(testDate, vB, 25, 'normal', '18:00', '22:00');  // Should match ratio (3W, 1M)
    insertEvent.run(testDate, vC, 50, 'normal', '18:00', '22:00');  // Should have 0 requirements

    console.log('✅ Phase 7 test data seeded successfully.');

} catch (err) {
    console.error('❌ Seeding failed:', err);
} finally {
    db.close();
}
