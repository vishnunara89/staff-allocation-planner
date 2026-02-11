import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/freelancers — List all freelancers
 */
export async function GET() {
    try {
        const freelancers = db.prepare('SELECT * FROM freelancers ORDER BY created_at DESC').all();
        return NextResponse.json(freelancers);
    } catch (error) {
        console.error('Fetch freelancers error:', error);
        return NextResponse.json({ error: 'Failed to fetch freelancers' }, { status: 500 });
    }
}

/**
 * POST /api/freelancers — Create a new freelancer
 */
export async function POST(request: Request) {
    try {
        const { name, phone, role, skills, notes } = await request.json();

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const result = db.prepare(`
            INSERT INTO freelancers (name, phone, role, skills, notes)
            VALUES (?, ?, ?, ?, ?)
        `).run(name, phone, role || null, skills || null, notes || null);

        return NextResponse.json({
            success: true,
            id: Number(result.lastInsertRowid),
            freelancer: { id: Number(result.lastInsertRowid), name, phone, role, skills, notes }
        });
    } catch (error) {
        console.error('Create freelancer error:', error);
        return NextResponse.json({ error: 'Failed to create freelancer' }, { status: 500 });
    }
}

/**
 * DELETE /api/freelancers — Delete a freelancer (via query param ?id=...)
 */
export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Freelancer ID required' }, { status: 400 });
        }

        db.prepare('DELETE FROM freelancers WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete freelancer error:', error);
        return NextResponse.json({ error: 'Failed to delete freelancer' }, { status: 500 });
    }
}
