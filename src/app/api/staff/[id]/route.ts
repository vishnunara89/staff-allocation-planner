import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { isAdmin } from '@/lib/auth-utils';

function parseStaff(row: any) {
    return {
        ...row,
        secondary_roles: row.secondary_roles ? JSON.parse(row.secondary_roles) : [],
        other_languages: row.other_languages ? JSON.parse(row.other_languages) : {},
        special_skills: row.special_skills ? JSON.parse(row.special_skills) : [],
        experience_tags: row.experience_tags ? JSON.parse(row.experience_tags) : []
    };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const stmt = db.prepare('SELECT * FROM staff WHERE id = ?');
        const row = stmt.get(params.id);
        if (!row) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
        return NextResponse.json(parseStaff(row));
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        const body = await request.json();

        const stmt = db.prepare(`
            UPDATE staff SET
                full_name = @full_name,
                primary_role_id = @primary_role_id,
                secondary_roles = @secondary_roles,
                english_proficiency = @english_proficiency,
                other_languages = @other_languages,
                special_skills = @special_skills,
                experience_tags = @experience_tags,
                home_base_venue_id = @home_base_venue_id,
                employment_type = @employment_type,
                availability_status = @availability_status,
                notes = @notes
            WHERE id = @id
        `);

        const result = stmt.run({
            id: params.id,
            full_name: body.full_name,
            primary_role_id: body.primary_role_id,
            secondary_roles: JSON.stringify(body.secondary_roles || []),
            english_proficiency: body.english_proficiency,
            other_languages: JSON.stringify(body.other_languages || {}),
            special_skills: JSON.stringify(body.special_skills || []),
            experience_tags: JSON.stringify(body.experience_tags || []),
            home_base_venue_id: body.home_base_venue_id || null,
            employment_type: body.employment_type,
            availability_status: body.availability_status,
            notes: body.notes
        });

        if (result.changes === 0) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

        return NextResponse.json({ id: params.id, ...body });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        if (!isAdmin()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        // Optional: Check for future assignments? For now force delete OK.
        const stmt = db.prepare('DELETE FROM staff WHERE id = ?');
        const res = stmt.run(params.id);
        if (res.changes === 0) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
    }
}
