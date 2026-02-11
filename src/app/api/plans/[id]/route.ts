import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserRole, getUserId } from '@/lib/auth-utils';

/**
 * GET /api/plans/[id] — Get plan details
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const plan = db.prepare('SELECT * FROM generated_plans WHERE id = ?').get(id) as any;

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Parse plan_data
        if (plan.plan_data) {
            try {
                plan.plan_data = JSON.parse(plan.plan_data);
            } catch { /* keep as string */ }
        }

        // Get activity log
        const activity = db.prepare(
            'SELECT * FROM plan_activity_log WHERE plan_id = ? ORDER BY performed_at DESC'
        ).all(id);

        // Get event info
        const event = db.prepare(`
            SELECT e.*, v.name as venue_name FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE e.id = ?
        `).get(plan.event_id);

        return NextResponse.json({ plan, event, activity });
    } catch (error) {
        console.error('Get plan error:', error);
        return NextResponse.json({ error: 'Failed to get plan' }, { status: 500 });
    }
}

/**
 * PUT /api/plans/[id] — Update plan
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { plan_data, assignments, status } = await request.json();

        const existing = db.prepare('SELECT * FROM generated_plans WHERE id = ?').get(id) as any;
        if (!existing) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        db.transaction(() => {
            // Update plan
            if (plan_data) {
                db.prepare('UPDATE generated_plans SET plan_data = ? WHERE id = ?')
                    .run(JSON.stringify(plan_data), id);
            }
            if (status) {
                db.prepare('UPDATE generated_plans SET status = ? WHERE id = ?')
                    .run(status, id);
            }

            // Update assignments if provided
            if (assignments && Array.isArray(assignments)) {
                const event = db.prepare('SELECT * FROM events WHERE id = ?').get(existing.event_id) as any;

                // Clear old and insert new
                db.prepare('DELETE FROM employee_assignments WHERE plan_id = ?').run(id);

                const insertAssignment = db.prepare(`
                    INSERT INTO employee_assignments (employee_id, event_id, plan_id, date, start_time, end_time, hours_worked, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'assigned')
                `);

                assignments.forEach((a: any) => {
                    if (a.staff_id && a.staff_id > 0 && !a.is_freelance) {
                        const startTime = a.shift_start || event?.start_time || '09:00';
                        const endTime = a.shift_end || event?.end_time || '17:00';
                        const [sh, sm] = startTime.split(':').map(Number);
                        const [eh, em] = endTime.split(':').map(Number);
                        let hours = (eh * 60 + em - sh * 60 - sm) / 60;
                        if (hours < 0) hours += 24;

                        insertAssignment.run(
                            a.staff_id, existing.event_id, id, event?.date || '',
                            startTime, endTime, Math.round(hours * 100) / 100
                        );
                    }
                });
            }

            // Log activity
            db.prepare(`
                INSERT INTO plan_activity_log (plan_id, event_id, action, performed_by, changes)
                VALUES (?, ?, 'plan_saved', ?, ?)
            `).run(id, existing.event_id, userId, 'Plan updated');
        })();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update plan error:', error);
        return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }
}

/**
 * DELETE /api/plans/[id] — Delete plan
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        db.transaction(() => {
            // Delete assignment records
            db.prepare('DELETE FROM employee_assignments WHERE plan_id = ?').run(id);
            // Delete activity log
            db.prepare('DELETE FROM plan_activity_log WHERE plan_id = ?').run(id);
            // Delete plan
            db.prepare('DELETE FROM generated_plans WHERE id = ?').run(id);
        })();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete plan error:', error);
        return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
    }
}
