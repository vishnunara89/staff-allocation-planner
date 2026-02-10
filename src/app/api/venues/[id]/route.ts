import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Venue } from '@/types';
import { isAdmin } from '@/lib/auth-utils';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(id) as Venue | undefined;

        if (!venue) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        return NextResponse.json(venue);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch venue' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const id = params.id;
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Venue name is required' }, { status: 400 });
        }

        const stmt = db.prepare(`
            UPDATE venues 
            SET name = @name, type = @type, default_service_style = @default_service_style, notes = @notes
            WHERE id = @id
        `);

        const info = stmt.run({
            id: id,
            name: body.name,
            type: body.type || 'other',
            default_service_style: body.default_service_style || 'sharing',
            notes: body.notes || ''
        });

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Venue not found or no changes made' }, { status: 404 });
        }

        return NextResponse.json({ id, ...body });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to update venue' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const id = params.id;

        // Check for dependencies (Events, Rules)
        const hasEvents = (db.prepare('SELECT COUNT(*) as count FROM events WHERE venue_id = ?').get(id) as any).count > 0;
        const hasRules = (db.prepare('SELECT COUNT(*) as count FROM staffing_rules WHERE venue_id = ?').get(id) as any).count > 0;

        if (hasEvents) {
            return NextResponse.json({
                error: `Cannot delete venue. usage: Events. Please delete events first.`
            }, { status: 409 });
        }

        // Unlink Staff (set home base to null)
        db.prepare('UPDATE staff SET home_base_venue_id = NULL WHERE home_base_venue_id = ?').run(id);

        // Cascade delete rules
        if (hasRules) {
            db.prepare('DELETE FROM staffing_rules WHERE venue_id = ?').run(id);
        }

        const stmt = db.prepare('DELETE FROM venues WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to delete venue' }, { status: 500 });
    }
}
