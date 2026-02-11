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
      UPDATE events 
      SET event_name = @event_name, date = @date, venue_id = @venue_id, guest_count = @guest_count,
          service_style_override = @service_style_override,
          special_requirements = @special_requirements, priority = @priority,
          start_time = @start_time, end_time = @end_time
      WHERE id = @id
    `);

        const info = stmt.run({
            id: id,
            event_name: body.event_name || null,
            date: body.date,
            venue_id: body.venue_id,
            guest_count: body.guest_count,
            service_style_override: body.service_style_override || null,
            special_requirements: body.special_requirements || '',
            priority: body.priority || 'normal',
            start_time: body.start_time || null,
            end_time: body.end_time || null
        });

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ id, ...body });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const stmt = db.prepare('DELETE FROM events WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
