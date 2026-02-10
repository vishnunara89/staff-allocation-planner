import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { CreateEventDTO } from '@/types';
import { getUserRole, getUserId } from '@/lib/auth-utils';

export async function GET(request: Request) {
    try {
        const role = getUserRole();
        const userId = getUserId();

        if (!role || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const venueId = searchParams.get('venue_id');

        let query = `
            SELECT e.*, v.name as venue_name 
            FROM events e
            LEFT JOIN venues v ON e.venue_id = v.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (role === "manager") {
            const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
            const ids = assigned.map(v => v.venue_id).filter(id => id !== null);

            if (ids.length === 0) return NextResponse.json([]);

            query += ` AND e.venue_id IN (${ids.join(',')})`;
        }

        if (date) {
            query += ' AND e.date = ?';
            params.push(date);
        } else if (searchParams.get('from_date')) {
            query += ' AND e.date >= ?';
            params.push(searchParams.get('from_date'));
        }

        if (venueId) {
            query += ' AND e.venue_id = ?';
            params.push(venueId);
        }

        query += ' ORDER BY e.date ASC, e.start_time ASC';

        const stmt = db.prepare(query);
        const events = stmt.all(...params);
        return NextResponse.json(events);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as CreateEventDTO;

        if (!body.date || !body.venue_id || !body.guest_count) {
            return NextResponse.json({ error: 'Date, Venue, and Guest Count are required' }, { status: 400 });
        }

        const stmt = db.prepare(`
      INSERT INTO events (
        date, venue_id, guest_count, service_style_override,
        special_requirements, priority, start_time, end_time
      )
      VALUES (
        @date, @venue_id, @guest_count, @service_style_override,
        @special_requirements, @priority, @start_time, @end_time
      )
    `);

        const result = stmt.run({
            date: body.date,
            venue_id: body.venue_id,
            guest_count: body.guest_count,
            service_style_override: body.service_style_override || null,
            special_requirements: body.special_requirements || '',
            priority: body.priority || 'normal',
            start_time: body.start_time || null,
            end_time: body.end_time || null
        });

        return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
