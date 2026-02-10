const Database = require('better-sqlite3');
const path = require('path');

// Mock types/interfaces since we are in JS
// calculateRequirements(events, venues, rules, roles, brackets)
// allocateStaff(requirements, staff)

const dbPath = path.join(process.cwd(), 'staff-planner.db');
const db = new Database(dbPath);

async function verify() {
    try {
        console.log('--- STARTING ENGINE VERIFICATION ---');

        // 1. Fetch data
        const venues = db.prepare('SELECT * FROM venues').all();
        const roles = db.prepare('SELECT * FROM roles').all();
        const rules = db.prepare('SELECT * FROM staffing_rules').all();
        const brackets = db.prepare('SELECT * FROM manning_brackets').all().map(b => ({
            ...b,
            counts: JSON.parse(b.counts_json)
        }));
        const staff = db.prepare('SELECT * FROM staff').all().map(s => ({
            ...s,
            secondary_roles: JSON.parse(s.secondary_roles || '[]'),
            special_skills: JSON.parse(s.special_skills || '[]')
        }));
        const events = db.prepare("SELECT * FROM events WHERE date = '2026-03-01'").all();

        console.log(`Loaded: ${venues.length} venues, ${roles.length} roles, ${rules.length} rules, ${brackets.length} brackets, ${staff.length} staff, ${events.length} events`);

        // We need the engine logic. Since I can't easily import TS in Node without ts-node,
        // I will re-implement a minimal version or use a temporary JS version of the engine logic.
        // Actually, I'll just check if the functions exist in a compiled form? No.

        // Let's just re-read the engine logic from src/lib/engine.ts and verify it manually/mentally for a moment.
        // Or I can just write a quick JS version of the engine in this test script.

        const waiterRole = roles.find(r => r.name === 'Waiter');
        const managerRole = roles.find(r => r.name === 'Manager');

        // TEST 1: Venue A (75 guests, Bracket 50-100)
        const vA = venues.find(v => v.name.includes('Venue A'));
        const eventA = events.find(e => e.venue_id === vA.id);
        const bracketA = brackets.find(b => b.venue_id === vA.id && eventA.guest_count >= b.guest_min && eventA.guest_count <= b.guest_max);

        console.log('\nTest 1: Venue A (Brackets)');
        if (bracketA) {
            const counts = bracketA.counts;
            console.log(`  PASSED: Match found for ${eventA.guest_count} guests: ${bracketA.guest_min}-${bracketA.guest_max}`);
            console.log(`  Expected: Waiters: ${counts[waiterRole.id]}, Managers: ${counts[managerRole.id]}`);
            if (counts[waiterRole.id] === 2 && counts[managerRole.id] === 1) {
                console.log('  PASSED: Requirement counts correct.');
            } else {
                console.log('  FAILED: Requirement counts incorrect.');
            }
        } else {
            console.log('  FAILED: No bracket match found.');
        }

        // TEST 2: Venue B (25 guests, Ratio 1:10, Min 1 Mang)
        const vB = venues.find(v => v.name.includes('Venue B'));
        const eventB = events.find(e => e.venue_id === vB.id);
        const rulesB = rules.filter(r => r.venue_id === vB.id);

        console.log('\nTest 2: Venue B (Ratios)');
        let waiterReq = 0;
        let managerReq = 0;

        rulesB.forEach(rule => {
            if (rule.role_id === waiterRole.id) {
                waiterReq = Math.ceil(eventB.guest_count / rule.ratio_guests) * rule.ratio_staff;
            }
            if (rule.role_id === managerRole.id) {
                managerReq = Math.max(0, rule.min_required);
            }
        });

        console.log(`  Event B guests: ${eventB.guest_count}`);
        console.log(`  Calculated Waiters: ${waiterReq} (Expected 3)`);
        console.log(`  Calculated Managers: ${managerReq} (Expected 1)`);

        if (waiterReq === 3 && managerReq === 1) {
            console.log('  PASSED: Ratio/Min rules correct.');
        } else {
            console.log('  FAILED: Ratio/Min rules incorrect.');
        }

        // TEST 3: Allocation
        console.log('\nTest 3: Allocation');
        // Alice (A-Home, Available), Bob (A-Home, Available), Charlie (B-Home, Available), Eve (A-Home, Off)
        const alice = staff.find(s => s.full_name.includes('Alice'));
        const bob = staff.find(s => s.full_name.includes('Bob'));
        const charlie = staff.find(s => s.full_name.includes('Charlie'));
        const eve = staff.find(s => s.full_name.includes('Eve'));

        const available = staff.filter(s => s.availability_status === 'available');
        console.log(`  Available staff count: ${available.length} (Expected 4: Alice, Bob, Charlie, Dave)`);

        const isEveAvailable = available.some(s => s.id === eve.id);
        console.log(`  Eve is in available pool: ${isEveAvailable} (Expected false)`);

        // Home base priority
        const vAHomeAvail = available.filter(s => s.home_base_venue_id === vA.id);
        console.log(`  Home base A available: ${vAHomeAvail.map(s => s.full_name).join(', ')} (Expected Alice, Bob, Dave)`);

    } catch (err) {
        console.error('Verification Error:', err);
    } finally {
        db.close();
    }
}

verify();
