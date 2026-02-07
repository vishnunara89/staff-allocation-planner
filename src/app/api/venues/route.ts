import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Venue, CreateVenueDTO } from '@/types';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM venues ORDER BY name ASC');
        const venues = stmt.all() as Venue[];
        return NextResponse.json(venues);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as CreateVenueDTO;

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Venue name is required' }, { status: 400 });
        }

        const stmt = db.prepare(`
            INSERT INTO venues (name, type, default_service_style, notes)
            VALUES (@name, @type, @default_service_style, @notes)
        `);

        const result = stmt.run({
            name: body.name,
            type: body.type || 'other',
            default_service_style: body.default_service_style || 'sharing',
            notes: body.notes || ''
        });

        return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create venue' }, { status: 500 });
    }
}
