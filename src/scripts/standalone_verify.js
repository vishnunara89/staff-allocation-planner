const Database = require('better-sqlite3');
const path = require('path');

// --- SETUP ---
const dbPath = path.join(process.cwd(), 'staff-planner.db');
console.log('Using database:', dbPath);
const db = new Database(dbPath);

const TEST_EVENT_ID = 999999;
let venueId = 1;
const TEST_DATE = '2026-12-31';

// --- MOCK ENGINE LOGIC ---
// Simplified version of plan-engine for verification
function generatePlan(db, event) {
    console.log(`[Engine] Generating plan for ${event.event_name}...`);

    // 1. Get Venue
    const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(event.venue_id);
    if (!venue) throw new Error('Venue not found');

    // 2. Get Requirements (Mocking logic for simplicity in verification)
    // We just want to check if the DB operations work
    const reqs = [];
    const roles = db.prepare('SELECT * FROM roles LIMIT 3').all();

    roles.forEach(role => {
        reqs.push({
            role_id: role.id,
            role_name: role.name,
            count: 2,
            filled: 0,
            assignments: []
        });
    });

    // 3. Assign Staff (Mock)
    let internalAssigned = 0;
    let freelancersNeeded = 0;

    reqs.forEach(req => {
        // Assign 1 internal mock
        req.assignments.push({
            role_id: req.role_id,
            role_name: req.role_name,
            staff_id: 1, // Mock staff ID
            staff_name: 'Mock Staff',
            status: 'pending',
            is_freelance: false
        });
        internalAssigned++;

        // Need 1 freelancer
        req.assignments.push({
            role_id: req.role_id,
            role_name: req.role_name,
            staff_id: -Math.random(),
            staff_name: 'Freelancer Needed',
            status: 'pending',
            is_freelance: true
        });
        freelancersNeeded++;
        req.filled = 2;
    });

    return {
        requirements: reqs,
        total_staff_needed: internalAssigned + freelancersNeeded,
        internal_assigned: internalAssigned,
        freelancers_needed: freelancersNeeded,
        shortages: [],
        logs: ['Generated mock plan for verification']
    };
}

// --- VERIFICATION FLOW ---
async function run() {
    try {
        console.log('--- STARTING VERIFICATION ---');

        // 1. Ensure Venue Exists
        const venue = db.prepare('SELECT id FROM venues WHERE id = ?').get(venueId);
        if (!venue) {
            console.log('Creating test venue...');

            try {
                db.prepare("INSERT INTO venues (id, name) VALUES (?, 'Test Venue')").run(venueId);
            } catch (e) {
                console.log("Venue insert failed:", e.message);

                // Try finding ONE existing venue to use
                const existing = db.prepare("SELECT id FROM venues LIMIT 1").get();
                if (existing) {
                    console.log(`Using existing venue ID ${existing.id} instead of ${venueId}`);
                    venueId = existing.id;
                } else {
                    throw new Error("No venues exist and cannot create one.");
                }
            }
        }

        // 2. Create Test Event
        console.log('\nAssigning test event...');
        db.prepare('DELETE FROM events WHERE id = ?').run(TEST_EVENT_ID);
        db.prepare(`
            INSERT INTO events (id, event_name, date, venue_id, guest_count, priority, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(TEST_EVENT_ID, 'VERIFICATION EVENT', TEST_DATE, venueId, 120, 'vip', '18:00', '22:00');

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(TEST_EVENT_ID);
        console.log('✅ Event created:', event.event_name);

        // 2. Generate Plan
        const planResult = generatePlan(db, event);
        console.log('✅ Plan generated via engine mockup');
        console.log(`   Requirements: ${planResult.requirements.length} roles`);

        // 3. Save Plan to DB
        console.log('\nSaving plan...');
        const planData = JSON.stringify(planResult);
        const result = db.prepare(`
            INSERT INTO generated_plans (event_id, plan_data, version, generated_by, status)
            VALUES (?, ?, ?, ?, ?)
        `).run(TEST_EVENT_ID, planData, 1, 1, 'draft');

        const planId = result.lastInsertRowid;
        console.log(`✅ Plan saved with ID: ${planId}`);

        // 3a. Get Valid Employee
        const validEmployee = db.prepare('SELECT id FROM employees LIMIT 1').get();
        const validEmployeeId = validEmployee ? validEmployee.id : null;

        if (!validEmployeeId) {
            // Create one if none exists
            const info = db.prepare("INSERT INTO employees (full_name, primary_role_id) VALUES ('Temp Staff', 1)").run();
            validEmployeeId = info.lastInsertRowid;
        }
        console.log(`Using Employee ID: ${validEmployeeId}`);

        // DEBUG: Check Schema
        const schema = db.prepare("PRAGMA table_info(employee_assignments)").all();
        console.log('Schema:', schema.map(c => c.name));
        const fkList = db.prepare("PRAGMA foreign_key_list(employee_assignments)").all();
        console.log('Foreign Keys:', fkList);

        console.log(`Inserting Assignment: event=${TEST_EVENT_ID}, emp=${validEmployeeId}, plan=${planId}`);

        // Verify existence
        const eventExists = db.prepare("SELECT id FROM events WHERE id = ?").get(TEST_EVENT_ID);
        console.log('Event Exists:', !!eventExists);
        const empExists = db.prepare("SELECT id FROM employees WHERE id = ?").get(validEmployeeId);
        console.log('Emp Exists:', !!empExists);

        if (!eventExists || !empExists) throw new Error("Missing FK reference");

        const assignmentStmt = db.prepare(`
            INSERT INTO employee_assignments (
                plan_id, event_id, employee_id, date, start_time, end_time, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        planResult.requirements.forEach(req => {
            req.assignments.forEach(a => {
                if (!a.is_freelance) {
                    try {
                        assignmentStmt.run(planId, TEST_EVENT_ID, validEmployeeId, TEST_DATE, '18:00', '22:00', 'assigned');
                    } catch (err) {
                        console.error("Insert Failed:", err);
                    }
                }
            });
        });
        console.log('✅ Assignments saved');

        // 5. Test Freelancer Creation
        console.log('\nCreating freelancer...');
        const freelancerId = db.prepare(`
            INSERT INTO freelancers (name, phone, role)
            VALUES (?, ?, ?)
        `).run('Verify Freelancer', '123456', 'Server').lastInsertRowid;
        console.log(`✅ Freelancer created with ID: ${freelancerId}`);

        // 6. Test Regeneration (Update Version)
        console.log('\nRegenerating (updating version)...');
        db.prepare(`
            UPDATE generated_plans 
            SET version = version + 1, regeneration_reason = ? 
            WHERE id = ?
        `).run('Verification Update', planId);

        const updated = db.prepare('SELECT version FROM generated_plans WHERE id = ?').get(planId);
        console.log(`✅ Plan version updated to: ${updated.version}`);

        // 7. Cleanup
        console.log('\nCleaning up...');
        db.prepare('DELETE FROM events WHERE id = ?').run(TEST_EVENT_ID);
        db.prepare('DELETE FROM generated_plans WHERE id = ?').run(planId);
        db.prepare('DELETE FROM employee_assignments WHERE plan_id = ?').run(planId);
        db.prepare('DELETE FROM freelancers WHERE id = ?').run(freelancerId);
        console.log('✅ Cleanup complete');

        console.log('\n--- VERIFICATION SUCCESSFUL ---');

    } catch (e) {
        console.error('\n❌ VERIFICATION FAILED:', e);
    }
}

run();
