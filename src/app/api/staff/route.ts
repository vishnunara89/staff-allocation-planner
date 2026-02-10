import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { StaffMember, CreateStaffDTO } from '@/types';
import { isAdmin, getUserRole, getUserId } from '@/lib/auth-utils';

function parseStaff(row: any): StaffMember {
    return {
        ...row,
        secondary_roles: row.secondary_roles ? JSON.parse(row.secondary_roles) : [],
        other_languages: row.other_languages ? JSON.parse(row.other_languages) : {},
        special_skills: row.special_skills ? JSON.parse(row.special_skills) : [],
        experience_tags: row.experience_tags ? JSON.parse(row.experience_tags) : []
    };
}

export async function GET() {
    try {
        const role = getUserRole();
        const userId = getUserId();

        if (!role || !userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let query = `
            SELECT s.*, r.name as primary_role_name, v.name as home_venue_name
            FROM staff s
            LEFT JOIN roles r ON s.primary_role_id = r.id
            LEFT JOIN venues v ON s.home_base_venue_id = v.id
        `;
        let params: any[] = [];

        if (role === "manager") {
            const assigned = db.prepare("SELECT venue_id FROM manager_venues WHERE manager_id = ?").all(userId) as { venue_id: number }[];
            const ids = assigned.map(v => v.venue_id).filter(id => id !== null);

            if (ids.length === 0) return NextResponse.json([]);

            query += ` WHERE s.home_base_venue_id IN (${ids.join(',')})`;
        }

        query += " ORDER BY s.full_name ASC";
        const rows = db.prepare(query).all(...params);
        const staff = rows.map(parseStaff);
        return NextResponse.json(staff);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json() as CreateStaffDTO;

        // Basic validation
        if (!body.full_name || !body.primary_role_id) {
            return NextResponse.json({ error: 'Name and Primary Role are required' }, { status: 400 });
        }

        const stmt = db.prepare(`
      INSERT INTO staff (
        full_name, primary_role_id, secondary_roles, english_proficiency,
        other_languages, special_skills, experience_tags, home_base_venue_id,
        employment_type, availability_status, notes
      )
      VALUES (
        @full_name, @primary_role_id, @secondary_roles, @english_proficiency,
        @other_languages, @special_skills, @experience_tags, @home_base_venue_id,
        @employment_type, @availability_status, @notes
      )
    `);

        const result = stmt.run({
            full_name: body.full_name,
            primary_role_id: body.primary_role_id,
            secondary_roles: JSON.stringify(body.secondary_roles || []),
            english_proficiency: body.english_proficiency || 'medium',
            other_languages: JSON.stringify(body.other_languages || {}),
            special_skills: JSON.stringify(body.special_skills || []),
            experience_tags: JSON.stringify(body.experience_tags || []),
            home_base_venue_id: body.home_base_venue_id || null,
            employment_type: body.employment_type || 'internal',
            availability_status: body.availability_status || 'available',
            notes: body.notes || ''
        });

        return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
    }
}
