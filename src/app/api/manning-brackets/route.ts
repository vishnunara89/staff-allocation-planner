import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ManningBracketRow } from '@/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const venue_id = searchParams.get('venue_id');
    const department = searchParams.get('department');

    if (!venue_id || !department) {
        return NextResponse.json({ error: 'Missing venue_id or department' }, { status: 400 });
    }

    try {
        const stmt = db.prepare(`
            SELECT * FROM manning_brackets 
            WHERE venue_id = ? AND department = ? 
            ORDER BY guest_min ASC
        `);
        const rows = stmt.all(venue_id, department);

        const brackets: ManningBracketRow[] = rows.map((row: any) => ({
            ...row,
            counts: JSON.parse(row.counts_json)
        }));

        return NextResponse.json(brackets);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { venue_id, department, brackets } = body;

        if (!venue_id || !department || !Array.isArray(brackets)) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        // Transaction handling using better-sqlite3
        const result = db.transaction(() => {
            // 1. Delete existing brackets for this venue+dept
            const deleteStmt = db.prepare('DELETE FROM manning_brackets WHERE venue_id = ? AND department = ?');
            deleteStmt.run(venue_id, department);

            // 2. Insert new brackets
            const insertStmt = db.prepare(`
                INSERT INTO manning_brackets (venue_id, department, guest_min, guest_max, counts_json, notes, source, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const now = new Date().toISOString();

            for (const b of brackets) {
                insertStmt.run(
                    venue_id,
                    department,
                    Number(b.guest_min),
                    Number(b.guest_max),
                    JSON.stringify(b.counts),
                    b.notes || '',
                    b.source || 'manual',
                    now
                );
            }
            return true;
        })();

        return NextResponse.json({ success: true, count: brackets.length });
    } catch (err: any) {
        console.error('Save brackets error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
