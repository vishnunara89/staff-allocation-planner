import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserRole, getUserId } from '@/lib/auth-utils';

/**
 * POST /api/plans/save
 * Save a generated plan to the database
 */
export async function POST(request: Request) {
    try {
        const role = getUserRole();
        const userId = getUserId();

        if (!role || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { event_id, plan_data, assignments } = await request.json();

        if (!event_id || !plan_data) {
            return NextResponse.json({ error: 'event_id and plan_data are required' }, { status: 400 });
        }

        // Get event details for date/time
        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(event_id) as any;
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const result = db.transaction(() => {
            // 1. Check if plan already exists for this event
            const existing = db.prepare('SELECT id FROM generated_plans WHERE event_id = ?').get(event_id) as any;

            let planId: number;

            if (existing) {
                // Update existing plan
                db.prepare(`
                    UPDATE generated_plans 
                    SET plan_data = ?, status = 'active', generated_at = CURRENT_TIMESTAMP,
                        generated_by = ?
                    WHERE event_id = ?
                `).run(JSON.stringify(plan_data), userId, event_id);
                planId = existing.id;

                // Clear old assignments
                db.prepare('DELETE FROM employee_assignments WHERE plan_id = ?').run(planId);
            } else {
                // Insert new plan
                const insertResult = db.prepare(`
                    INSERT INTO generated_plans (event_id, generated_by, status, plan_data)
                    VALUES (?, ?, 'active', ?)
                `).run(event_id, userId, JSON.stringify(plan_data));
                planId = Number(insertResult.lastInsertRowid);
            }

            // 2. Create employee_assignments for internal staff
            if (assignments && Array.isArray(assignments)) {
                const insertAssignment = db.prepare(`
                    INSERT INTO employee_assignments (employee_id, event_id, plan_id, date, start_time, end_time, hours_worked, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned')
                `);

                assignments.forEach((a: any) => {
                    if (a.staff_id && a.staff_id > 0 && !a.is_freelance) {
                        const startTime = a.shift_start || event.start_time || '09:00';
                        const endTime = a.shift_end || event.end_time || '17:00';

                        // Calculate hours
                        const [sh, sm] = startTime.split(':').map(Number);
                        const [eh, em] = endTime.split(':').map(Number);
                        let hours = (eh * 60 + em - sh * 60 - sm) / 60;
                        if (hours < 0) hours += 24;

                        insertAssignment.run(
                            a.staff_id,
                            event_id,
                            planId,
                            event.date,
                            startTime,
                            endTime,
                            Math.round(hours * 100) / 100
                        );

                        // Update employee status to 'in-event' if currently 'available'
                        db.prepare(`
                            UPDATE employees 
                            SET availability_status = 'in-event' 
                            WHERE id = ? AND availability_status = 'available'
                        `).run(a.staff_id);
                    }
                });
            }

            // 3. Log the activity
            db.prepare(`
                INSERT INTO plan_activity_log (plan_id, event_id, action, performed_by)
                VALUES (?, ?, 'plan_saved', ?)
            `).run(planId, event_id, userId);

            // 4. Also save to staffing_plans for backward compatibility
            try {
                db.prepare('DELETE FROM staffing_plans WHERE event_date = ? AND venue_id = ?')
                    .run(event.date, event.venue_id);

                const insertStaffingPlan = db.prepare(`
                    INSERT INTO staffing_plans (event_date, venue_id, staff_id, assigned_role_id, status, reasoning)
                    VALUES (?, ?, ?, ?, 'confirmed', 'Auto-generated')
                `);

                if (assignments && Array.isArray(assignments)) {
                    assignments.forEach((a: any) => {
                        if (a.staff_id && a.staff_id > 0 && !a.is_freelance) {
                            insertStaffingPlan.run(event.date, event.venue_id, a.staff_id, a.role_id);
                        }
                    });
                }
            } catch (e) {
                // staffing_plans table might not exist in all environments
                console.warn('Could not update staffing_plans (backward compat):', e);
            }

            return planId;
        })();

        return NextResponse.json({ success: true, plan_id: result });
    } catch (error) {
        console.error('Save plan error:', error);
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }
}
