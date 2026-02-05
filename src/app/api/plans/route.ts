import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { date, venue_id, assignments } = await request.json();

        // Transaction to save plan
        const insert = db.prepare(`
        INSERT INTO staffing_plans (event_date, venue_id, staff_id, assigned_role_id, status, reasoning)
        VALUES (@event_date, @venue_id, @staff_id, @assigned_role_id, @status, @reasoning)
    `);

        const deleteOld = db.prepare('DELETE FROM staffing_plans WHERE event_date = ? AND venue_id = ?');

        db.transaction(() => {
            // Simple strategy: Clear previous plan for this venue/date and insert new
            // Ideally we would update existing, but for MVP this ensures we match the "generated" state.

            // If we are saving for multiple venues (which the daily plan is), we need to handle that.
            // The UI should probably allow saving the whole day.

            // Let's assume 'assignments' contains all assignments for the day for multiple venues.
            // We will delete all plans for this date first? Or just the venues involved?
            // Let's being safe: Delete for the date involved.

            if (assignments.length > 0) {
                db.prepare('DELETE FROM staffing_plans WHERE event_date = ?').run(date);
            }

            assignments.forEach((a: any) => {
                if (a.staff_id) { // Only save assigned internal staff? Or record shortages too?
                    // Schema has staff_id as foreign key, so shortages with null staff_id might fail if we didn't make it nullable.
                    // Let's check schema: "staff_id INTEGER... FOREIGN KEY..." usually implies it can be null unless NOT NULL specified.
                    // My init script: "staff_id INTEGER... FOREIGN KEY..." - allowed null by default in SQLite.

                    insert.run({
                        event_date: date,
                        venue_id: a.venue_id,
                        staff_id: a.staff_id,
                        assigned_role_id: a.role_id,
                        status: 'confirmed',
                        reasoning: a.reason
                    });
                }
            });
        })();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save plan error:', error);
        return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }
}
