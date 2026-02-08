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
        secondary_roles: data.secondary_roles ? data.secondary_roles.split(';') : [],
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
        console.log('[BULK IMPORT] Starting import process...');

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            console.error('[BULK IMPORT] No file uploaded');
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        console.log('[BULK IMPORT] File received:', file.name, 'Size:', file.size);

        const text = await file.text();
        console.log('[BULK IMPORT] Raw file content (first 500 chars):', text.substring(0, 500));

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        console.log('[BULK IMPORT] Total lines:', lines.length);
        console.log('[BULK IMPORT] First 3 lines:', lines.slice(0, 3));

        if (lines.length < 2) {
            return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        console.log('[BULK IMPORT] Headers:', headers);

        // Improved CSV splitting that handles quoted fields
        const splitCSV = (str: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < str.length; i++) {
                const char = str[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result;
        };

        // Fetch lookups
        const roles = db.prepare('SELECT id, name FROM roles').all() as any[];
        const venues = db.prepare('SELECT id, name FROM venues').all() as any[];

        console.log('[BULK IMPORT] Available roles:', roles.map(r => r.name).join(', '));
        console.log('[BULK IMPORT] Available venues:', venues.map(v => v.name).join(', '));

        let successCount = 0;
        const errors: string[] = [];

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

        const insertMany = db.transaction((staffList: any[]) => {
            for (const staff of staffList) {
                try {
                    insertStmt.run(staff);
                } catch (err: any) {
                    console.error('[BULK IMPORT] Insert error for', staff.full_name, ':', err.message);
                    throw err;
                }
            }
        });

        const staffToInsert = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const cols = splitCSV(lines[i]);
                const rowData: any = {};
                headers.forEach((h, idx) => rowData[h] = cols[idx] || '');

                console.log(`[BULK IMPORT] Processing row ${i}:`, rowData.full_name);

                const parsed = parseCSVRow(rowData, roles, venues);

                // Validation - only require name
                if (!parsed.full_name || parsed.full_name.trim() === '') {
                    const error = `Row ${i}: Missing staff name`;
                    console.warn('[BULK IMPORT]', error);
                    errors.push(error);
                    continue;
                }

                // If role not found, use first available role as default
                if (!parsed.primary_role_id && roles.length > 0) {
                    const defaultRole = roles[0];
                    parsed.primary_role_id = defaultRole.id;
                    const warning = `Row ${i} (${parsed.full_name}): Role "${rowData.primary_role}" not found. Using default role: ${defaultRole.name}`;
                    console.warn('[BULK IMPORT]', warning);
                    errors.push(warning);
                }

                staffToInsert.push({
                    ...parsed,
                    secondary_roles: JSON.stringify(parsed.secondary_roles),
                    other_languages: JSON.stringify(parsed.other_languages),
                    special_skills: JSON.stringify(parsed.special_skills),
                    experience_tags: JSON.stringify(parsed.experience_tags)
                });

                successCount++;
            } catch (e: any) {
                const error = `Row ${i}: ${e.message}`;
                console.error('[BULK IMPORT]', error);
                errors.push(error);
            }
        }

        console.log('[BULK IMPORT] Validated rows:', staffToInsert.length);
        console.log('[BULK IMPORT] Errors:', errors.length);

        if (staffToInsert.length === 0) {
            return NextResponse.json({
                error: 'No valid rows to import. Errors: ' + errors.join('; '),
                details: errors
            }, { status: 400 });
        }

        try {
            insertMany(staffToInsert);
            console.log('[BULK IMPORT] Successfully inserted', successCount, 'staff members');
        } catch (dbError: any) {
            console.error('[BULK IMPORT] Database error:', dbError);
            return NextResponse.json({
                error: 'Database error: ' + dbError.message,
                details: errors
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('[BULK IMPORT] Fatal error:', error);
        return NextResponse.json({
            error: 'Failed to import CSV: ' + error.message
        }, { status: 500 });
    }
}
