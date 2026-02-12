import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserId } from '@/lib/auth-utils';
import { generatePlanForEvent } from '@/lib/plan-engine';

/**
 * POST /api/plans/[id]/regenerate — Regenerate plan with reason
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { reason } = await request.json();

        // Get existing plan
        const existing = db.prepare('SELECT * FROM generated_plans WHERE id = ?').get(id) as any;
        if (!existing) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Get event
        const event = db.prepare(`
            SELECT e.*, v.name as venue_name FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE e.id = ?
        `).get(existing.event_id) as any;

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Generate new plan
        const result = generatePlanForEvent(db, event, userId);

        // Update in database
        db.transaction(() => {
            // Archive old plan version
            const newVersion = (existing.version || 1) + 1;

            // Update plan with new data
            db.prepare(`
                UPDATE generated_plans 
                SET plan_data = ?, version = ?, regeneration_reason = ?,
                    generated_at = CURRENT_TIMESTAMP, generated_by = ?, status = 'active'
                WHERE id = ?
            `).run(
                JSON.stringify({
                    requirements: result.requirements,
                    shortages: result.shortages,
                    total_staff_needed: result.total_staff_needed,
                    internal_assigned: result.internal_assigned,
                    freelancers_needed: result.freelancers_needed
                }),
                newVersion,
                reason || 'No reason provided',
                userId,
                id
            );

            // Clear old assignments
            db.prepare('DELETE FROM employee_assignments WHERE plan_id = ?').run(id);

            // Create new assignments
            const insertAssignment = db.prepare(`
                INSERT INTO employee_assignments (employee_id, event_id, plan_id, date, start_time, end_time, hours_worked, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned')
            `);

            result.requirements.forEach(req => {
                req.assignments.forEach(a => {
                    if (a.staff_id > 0 && !a.is_freelance) {
                        const startTime = event.start_time || '09:00';
                        const endTime = event.end_time || '17:00';
                        const [sh, sm] = startTime.split(':').map(Number);
                        const [eh, em] = endTime.split(':').map(Number);
                        let hours = (eh * 60 + em - sh * 60 - sm) / 60;
                        if (hours < 0) hours += 24;

                        insertAssignment.run(
                            a.staff_id, existing.event_id, id, event.date,
                            startTime, endTime, Math.round(hours * 100) / 100
                        );

                        // Update employee status to 'in-event' if currently 'available'
                        db.prepare(`
                            UPDATE employees 
                            SET availability_status = 'in-event' 
                            WHERE id = ? AND availability_status = 'available'
                        `).run(a.staff_id);
                    }
                });
            });

            // Log activity
            db.prepare(`
                INSERT INTO plan_activity_log (plan_id, event_id, action, reason, performed_by, changes)
                VALUES (?, ?, 'regenerated', ?, ?, ?)
            `).run(id, existing.event_id, reason || '', userId, `Version ${newVersion}`);
        })();

        return NextResponse.json({
            success: true,
            plan: result,
            version: (existing.version || 1) + 1
        });
    } catch (error) {
        console.error('Regenerate plan error:', error);
        return NextResponse.json({ error: 'Failed to regenerate plan' }, { status: 500 });
    }
}
