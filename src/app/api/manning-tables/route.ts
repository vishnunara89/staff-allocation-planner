import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const venue_id = searchParams.get('venue_id');

    if (!venue_id) {
        return NextResponse.json({ error: 'Missing venue_id' }, { status: 400 });
    }

    try {
        const stmt = db.prepare(`
            SELECT department, config_json, updated_at 
            FROM venue_manning_tables 
            WHERE venue_id = ?
        `);
        const rows = stmt.all(venue_id);

        const result = rows.map((row: any) => ({
            department: row.department,
            config: JSON.parse(row.config_json),
            updated_at: row.updated_at
        }));

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('GET manning-tables error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { venue_id, department, config } = body;

        if (!venue_id || !department || !config) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const configJson = JSON.stringify(config);

        // Upsert using INSERT OR REPLACE
        const stmt = db.prepare(`
            INSERT INTO venue_manning_tables (venue_id, department, config_json, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(venue_id, department) DO UPDATE SET
                config_json = excluded.config_json,
                updated_at = excluded.updated_at
        `);

        stmt.run(venue_id, department, configJson, now);

        return NextResponse.json({ success: true, venue_id, department });
    } catch (err: any) {
        console.error('POST manning-tables error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
