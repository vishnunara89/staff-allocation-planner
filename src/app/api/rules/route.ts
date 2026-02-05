import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { CreateStaffingRuleDTO } from '@/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const venueId = searchParams.get('venue_id');

        let stmt;
        if (venueId) {
            stmt = db.prepare('SELECT * FROM staffing_rules WHERE venue_id = ?');
            const rules = stmt.all(venueId);
            return NextResponse.json(rules);
        } else {
            stmt = db.prepare('SELECT * FROM staffing_rules');
            const rules = stmt.all();
            return NextResponse.json(rules);
        }
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json() as CreateStaffingRuleDTO;

        if (!body.venue_id || !body.role_id) {
            return NextResponse.json({ error: 'Venue ID and Role ID are required' }, { status: 400 });
        }

        const stmt = db.prepare(`
      INSERT INTO staffing_rules (
        venue_id, department, role_id, ratio_guests, ratio_staff,
        threshold_guests, threshold_staff, min_required, max_allowed, notes
      )
      VALUES (
        @venue_id, @department, @role_id, @ratio_guests, @ratio_staff,
        @threshold_guests, @threshold_staff, @min_required, @max_allowed, @notes
      )
    `);

        const result = stmt.run({
            venue_id: body.venue_id,
            department: body.department || 'service',
            role_id: body.role_id,
            ratio_guests: body.ratio_guests || 0,
            ratio_staff: body.ratio_staff || 0,
            threshold_guests: body.threshold_guests || null,
            threshold_staff: body.threshold_staff || null,
            min_required: body.min_required || 0,
            max_allowed: body.max_allowed || null,
            notes: body.notes || ''
        });

        return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
    }
}
