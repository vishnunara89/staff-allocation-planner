import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateRequirements, allocateStaff } from '@/lib/engine';
import { Venue, StaffingRule, Event, StaffMember, Role, ManningBracketRow } from '@/types';

export async function GET() {
    try {
        // 1. Fetch the seeded data
        const venues = db.prepare('SELECT * FROM venues WHERE name LIKE "Venue %"').all() as Venue[];
        const roles = db.prepare('SELECT * FROM roles').all() as Role[];
        const rules = db.prepare('SELECT * FROM staffing_rules').all() as StaffingRule[];
        const brackets = db.prepare('SELECT * FROM manning_brackets').all().map((b: any) => ({
            ...b,
            counts: JSON.parse(b.counts_json)
        })) as ManningBracketRow[];
        const staff = db.prepare('SELECT * FROM staff').all().map((s: any) => ({
            ...s,
            secondary_roles: JSON.parse(s.secondary_roles || '[]'),
            special_skills: JSON.parse(s.special_skills || '[]'),
            other_languages: JSON.parse(s.other_languages || '{}'),
            experience_tags: JSON.parse(s.experience_tags || '[]')
        })) as StaffMember[];
        const events = db.prepare('SELECT * FROM events WHERE date = "2026-03-01"').all() as Event[];

        const results: any = {
            tests: [],
            summary: { success: 0, total: 0 }
        };

        const assert = (name: string, condition: boolean, details: any) => {
            results.summary.total++;
            if (condition) results.summary.success++;
            results.tests.push({ name, success: condition, ...details });
        };

        // --- TEST 1: Venue A (Brackets) ---
        const eventA = events.find(e => e.venue_id === venues.find(v => v.name.includes('Venue A')).id);
        const reqsA = calculateRequirements([eventA], venues, rules, roles, brackets);

        // Expected: Bracket 50-100 -> {Waiter: 2, Manager: 1}
        const waiterRole = roles.find(r => r.name === 'Waiter');
        const managerRole = roles.find(r => r.name === 'Manager');

        const waiterReqA = reqsA.find(r => r.role_id === waiterRole.id);
        const managerReqA = reqsA.find(r => r.role_id === managerRole.id);

        assert('Venue A Bracket Match (Waiters)', waiterReqA?.count === 2, { actual: waiterReqA?.count, expected: 2 });
        assert('Venue A Bracket Match (Managers)', managerReqA?.count === 1, { actual: managerReqA?.count, expected: 1 });

        // --- TEST 2: Venue B (Ratios) ---
        const eventB = events.find(e => e.venue_id === venues.find(v => v.name.includes('Venue B')).id);
        const reqsB = calculateRequirements([eventB], venues, rules, roles, brackets);

        // Expected: 25 guests -> 3 Waiters (1 per 10 guests, ceil(25/10)=3), 1 Manager (min 1)
        const waiterReqB = reqsB.find(r => r.role_id === waiterRole.id);
        const managerReqB = reqsB.find(r => r.role_id === managerRole.id);

        assert('Venue B Ratio (Waiters)', waiterReqB?.count === 3, { actual: waiterReqB?.count, expected: 3 });
        assert('Venue B Minimum (Managers)', managerReqB?.count === 1, { actual: managerReqB?.count, expected: 1 });

        // --- TEST 3: Venue C (No Rules) ---
        const eventC = events.find(e => e.venue_id === venues.find(v => v.name.includes('Venue C')).id);
        const reqsC = calculateRequirements([eventC], venues, rules, roles, brackets);
        assert('Venue C No Rules (Graceful)', reqsC.length === 0, { actual: reqsC.length, expected: 0 });

        // --- TEST 4: Allocation Priorities ---
        // Allocation for Venue A (needs 2 Waiters)
        const vAId = venues.find(v => v.name.includes('Venue A')).id;
        const allocationA = allocateStaff(reqsA.filter(r => r.venue_id === vAId), staff);

        // Alice and Bob both have Venue A as home base. They should be assigned.
        const Alice = staff.find(s => s.full_name.includes('Alice'));
        const Bob = staff.find(s => s.full_name.includes('Bob'));
        const Charlie = staff.find(s => s.full_name.includes('Charlie')); // Home B

        const assignedAlice = allocationA.assignments.find(a => a.staff_id === Alice.id);
        const assignedBob = allocationA.assignments.find(a => a.staff_id === Bob.id);
        const assignedCharlie = allocationA.assignments.find(a => a.staff_id === Charlie.id);

        assert('Allocation Priority (Home Base Alice)', !!assignedAlice, { assigned: assignedAlice?.staff_name });
        assert('Allocation Priority (Home Base Bob)', !!assignedBob, { assigned: assignedBob?.staff_name });
        assert('Allocation Priority (Avoid Charlie if possible)', !assignedCharlie, { assigned: assignedCharlie?.staff_name });

        // --- TEST 5: Availability Status ---
        const Eve = staff.find(s => s.full_name.includes('Eve')); // Status 'off'
        const assignedEve = allocationA.assignments.find(a => a.staff_id === Eve.id);
        assert('Allocation Availability (Respect "off" status)', !assignedEve, { assigned: assignedEve?.staff_name });

        // --- TEST 6: Shortages ---
        // Venue B needs 3 Waiters. Alice and Bob are used for Venue A. Charlie is available. 
        // Total Waiters available: Alice, Bob, Charlie. Alice and Bob are taken.
        // Charlie should be assigned, but Venue B still needs 2 more Waiters.

        // We need to run allocation globally or sequentially. 
        // Our engine currently takes a pool of staff.

        const allReqs = [...reqsA, ...reqsB];
        const globalAllocation = allocateStaff(allReqs, staff);

        const shortages = globalAllocation.shortages.filter(s => s.role_name === 'Waiter');
        const waiterShortageCount = shortages.reduce((sum, s) => sum + s.count, 0);

        // Alice, Bob, Charlie = 3 Waiters. AllReqs = 2 (A) + 3 (B) = 5 Waiters needed.
        // Shortage should be 2.
        assert('Shortage Calculation', waiterShortageCount === 2, { actual: waiterShortageCount, expected: 2 });

        return NextResponse.json(results);
    } catch (error: any) {
        console.error('Test Engine Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
