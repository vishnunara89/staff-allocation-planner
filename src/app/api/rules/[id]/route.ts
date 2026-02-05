import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();

        const stmt = db.prepare(`
      UPDATE staffing_rules 
      SET department = @department, role_id = @role_id, 
          ratio_guests = @ratio_guests, ratio_staff = @ratio_staff,
          threshold_guests = @threshold_guests, threshold_staff = @threshold_staff,
          min_required = @min_required, max_allowed = @max_allowed, notes = @notes
      WHERE id = @id
    `);

        const info = stmt.run({
            id: id,
            department: body.department,
            role_id: body.role_id,
            ratio_guests: body.ratio_guests,
            ratio_staff: body.ratio_staff,
            threshold_guests: body.threshold_guests,
            threshold_staff: body.threshold_staff,
            min_required: body.min_required,
            max_allowed: body.max_allowed,
            notes: body.notes
        });

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ id, ...body });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const stmt = db.prepare('DELETE FROM staffing_rules WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
    }
}
