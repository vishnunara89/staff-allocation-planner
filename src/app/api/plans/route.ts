import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserRole, getUserId } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const role = getUserRole();
        const userId = getUserId();

        if (!role || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Unified query from generated_plans
        let query = `
            SELECT 
                gp.id as plan_id,
                e.date as event_date,
                e.venue_id,
                e.id as event_id,
                gp.status,
                gp.version,
                gp.generated_at,
                u.name as generated_by_name,
                (SELECT COUNT(*) FROM employee_assignments ea WHERE ea.plan_id = gp.id) as staff_count,
                (SELECT COUNT(*) FROM employee_assignments ea WHERE ea.plan_id = gp.id AND ea.is_freelance = 1) as freelancer_count
            FROM generated_plans gp
            JOIN events e ON gp.event_id = e.id
            LEFT JOIN users u ON gp.generated_by = u.id
        `;

        const params: any[] = [];

        // Manager filter: only show plans for their venues
        if (role === "manager") {
            const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
            const ids = assigned.map(v => v.venue_id).filter(id => id !== null);

            if (ids.length === 0) return NextResponse.json([]); // No venues assigned

            query += ` WHERE e.venue_id IN (${ids.join(',')})`;
        }

        query += " ORDER BY e.date DESC";

        const plans = db.prepare(query).all(...params);
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Fetch plans error:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { event_id, date, venue_id, assignments } = await request.json();
        const userId = getUserId();

        if (!event_id || !date || !venue_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const insertPlan = db.prepare(`
            INSERT INTO generated_plans (event_id, generated_by, status, version, plan_data)
            VALUES (@event_id, @generated_by, 'draft', 1, @plan_data)
        `);

        const insertAssignment = db.prepare(`
            INSERT INTO employee_assignments (
                employee_id, event_id, plan_id, date, start_time, end_time, 
                status, is_freelance, role_id
            )
            VALUES (
                @employee_id, @event_id, @plan_id, @date, @start_time, @end_time, 
                'assigned', @is_freelance, @role_id
            )
        `);

        // Get event details for times
        const event = db.prepare('SELECT start_time, end_time FROM events WHERE id = ?').get(event_id) as { start_time: string, end_time: string };

        let planId: any;
        db.transaction(() => {
            // 1. Cleanup existing generated plan for this event
            db.prepare('DELETE FROM generated_plans WHERE event_id = ?').run(event_id);

            // 2. Insert new Plan
            const result = insertPlan.run({
                event_id,
                generated_by: userId || 1, // Default to admin if not found (shouldn't happen in real app)
                plan_data: JSON.stringify(assignments)
            });
            planId = result.lastInsertRowid;

            // 3. Insert Assignments
            assignments.forEach((a: any) => {
                insertAssignment.run({
                    employee_id: a.staff_id || -1, // -1 for unassigned/freelance placeholder if null
                    event_id,
                    plan_id: planId,
                    date,
                    start_time: event?.start_time || '00:00',
                    end_time: event?.end_time || '23:59',
                    is_freelance: a.staff_id ? 0 : 1, // Logic: if staff_id is present, it's internal. If null/negative, it's freelance/gap.
                    role_id: a.role_id
                });
            });

            // 4. Update employee statuses to 'in-event' if they are currently 'available'
            assignments.forEach((a: any) => {
                if (a.staff_id && a.staff_id > 0) {
                    db.prepare(`
                        UPDATE employees 
                        SET availability_status = 'in-event' 
                        WHERE id = ? AND availability_status = 'available'
                    `).run(a.staff_id);
                }
            });

            // 5. Update legacy staffing_plans for compatibility (Optional, but safe)
            db.prepare('DELETE FROM staffing_plans WHERE event_date = ? AND venue_id = ?').run(date, venue_id);
            const insertLegacy = db.prepare(`
                INSERT INTO staffing_plans (event_date, venue_id, staff_id, assigned_role_id, status, reasoning)
                VALUES (@event_date, @venue_id, @staff_id, @assigned_role_id, 'confirmed', 'Auto-generated')
            `);

            assignments.forEach((a: any) => {
                if (a.staff_id && a.staff_id > 0) {
                    insertLegacy.run({
                        event_date: date,
                        venue_id,
                        staff_id: a.staff_id,
                        assigned_role_id: a.role_id
                    });
                }
            });

        })();

        return NextResponse.json({ success: true, planId: Number(planId) });
    } catch (error) {
        console.error('Save plan error:', error);
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }
}
