import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { CreateStaffDTO } from '@/types';

function parseCSVRow(data: any, roles: any[], venues: any[]) {
    // Map role name to ID
    const role = roles.find(r => r.name.toLowerCase() === (data.primary_role || '').toLowerCase());
    const roleId = role ? role.id : null;

    // Map venue name to ID
    const venue = venues.find(v => v.name.toLowerCase() === (data.home_base_venue || '').toLowerCase());
    const venueId = venue ? venue.id : null;

    return {
        full_name: data.full_name,
        primary_role_id: roleId,
        home_base_venue_id: venueId,
        secondary_roles: data.secondary_roles ? data.secondary_roles.split(';') : [], // Expect ; or something else if CSV comma issue
        english_proficiency: data.english_proficiency || 'intermediate',
        other_languages: data.other_languages ? data.other_languages.split(',').reduce((acc: any, l: string) => ({ ...acc, [l.trim()]: 'fluent' }), {}) : {},
        special_skills: data.special_skills ? data.special_skills.split(',') : [],
        employment_type: data.employment_type || 'freelance',
        availability_status: data.availability_status || 'available',
        notes: data.notes || '',
        experience_tags: []
    };
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const text = await file.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(',').map(h => h.trim());

        // Helper to simple split CSV ignoring quotes (simplified for speed, robust enough for template)
        // For production, use a regex or library.
        // Quick regex for CSV splitting: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/
        const splitCSV = (str: string) => str.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/^"|"$/g, '').trim());

        // Fetch lookups
        const roles = db.prepare('SELECT id, name FROM roles').all() as any[];
        const venues = db.prepare('SELECT id, name FROM venues').all() as any[];

        let successCount = 0;
        const errors = [];

        const insertStmt = db.prepare(`
            INSERT INTO staff (
                full_name, primary_role_id, secondary_roles, english_proficiency,
                other_languages, special_skills, experience_tags, home_base_venue_id,
                employment_type, availability_status, notes
            ) VALUES (
                @full_name, @primary_role_id, @secondary_roles, @english_proficiency,
                @other_languages, @special_skills, @experience_tags, @home_base_venue_id,
                @employment_type, @availability_status, @notes
            )
        `);

        // Transaction for bulk insert? Or just loop. Loop is fine for small scale.
        const insertMany = db.transaction((staffList) => {
            for (const staff of staffList) insertStmt.run(staff);
        });

        const staffToInsert = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const cols = splitCSV(lines[i]);
                const rowData: any = {};
                headers.forEach((h, idx) => rowData[h] = cols[idx]);

                const parsed = parseCSVRow(rowData, roles, venues);

                if (!parsed.full_name || !parsed.primary_role_id) {
                    // Skip invalid rows but maybe log error?
                    console.warn(`Row ${i} skipped: Missing name or valid role match.`);
                    continue;
                }

                staffToInsert.push({
                    ...parsed,
                    secondary_roles: JSON.stringify(parsed.secondary_roles),
                    other_languages: JSON.stringify(parsed.other_languages),
                    special_skills: JSON.stringify(parsed.special_skills),
                    experience_tags: JSON.stringify(parsed.experience_tags)
                });

                successCount++;
            } catch (e) {
                console.error(`Error processing row ${i}`, e);
            }
        }

        if (staffToInsert.length > 0) {
            insertMany(staffToInsert);
        }

        return NextResponse.json({ success: true, count: successCount });

    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 });
    }
}
