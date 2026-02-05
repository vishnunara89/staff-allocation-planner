import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Role } from '@/types';

export async function GET() {
    try {
        const stmt = db.prepare('SELECT * FROM roles ORDER BY name ASC');
        const roles = stmt.all() as Role[];
        return NextResponse.json(roles);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
}
