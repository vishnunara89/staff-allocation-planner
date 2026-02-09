import { NextResponse } from 'next/server';
import db from '@/lib/db';
import * as XLSX from 'xlsx';

function parseCSVRow(data: any, roles: any[], venues: any[]) {
    // Map role name to ID
    const role = roles.find(r => r.name.toLowerCase() === (data.primary_role || '').toLowerCase());
    const roleId = role ? role.id : null;

    // Map venue name to ID
    const venue = venues.find(v => v.name.toLowerCase() === (data.home_base_venue || '').toLowerCase());
    const venueId = venue ? venue.id : null;

    // Phone handling: Append to notes
    let notes = data.notes || '';
    if (data.phone_number) {
        const phoneEntry = `Phone:${data.phone_number}`;
        if (!notes) {
            notes = phoneEntry;
        } else if (!notes.toLowerCase().includes('phone:')) {
            notes = `${notes}\n${phoneEntry}`.trim();
        }
    }

    return {
        full_name: data.full_name,
        primary_role_id: roleId,
        home_base_venue_id: venueId,
        secondary_roles: data.secondary_roles ? data.secondary_roles.split(',').map((s: string) => s.trim()) : [],
        english_proficiency: data.english_proficiency || 'basic',
        other_languages: data.other_languages ? data.other_languages.split(',').reduce((acc: any, l: string) => ({ ...acc, [l.trim()]: 'fluent' }), {}) : {},
        special_skills: data.special_skills ? data.special_skills.split(',').map((s: string) => s.trim()) : [],
        employment_type: data.employment_type || 'internal',
        availability_status: data.availability_status || 'available',
        notes: notes,
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

        const fileName = file.name.toLowerCase();
        let rows: any[] = [];

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(firstSheet);
        } else {
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
            if (lines.length < 2) {
                return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
            }

            const splitCSV = (str: string) => {
                const result = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < str.length; i++) {
                    if (str[i] === '"') inQuotes = !inQuotes;
                    else if (str[i] === ',' && !inQuotes) {
                        result.push(current.trim().replace(/^"|"$/g, ''));
                        current = '';
                    } else current += str[i];
                }
                result.push(current.trim().replace(/^"|"$/g, ''));
                return result;
            };

            const headers = splitCSV(lines[0]);
            for (let i = 1; i < lines.length; i++) {
                const cols = splitCSV(lines[i]);
                const rowData: any = {};
                headers.forEach((h, idx) => rowData[h] = cols[idx] || '');
                rows.push(rowData);
            }
        }

        // Fetch lookups
        const roles = db.prepare('SELECT id, name FROM roles').all() as any[];
        const venues = db.prepare('SELECT id, name FROM venues').all() as any[];

        let successCount = 0;
        const resultDetails: any[] = [];
        const staffToInsert: any[] = [];

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

        rows.forEach((rowData, index) => {
            const rowNum = index + 1;
            const name = rowData.full_name || '';

            try {
                if (!name || name.trim() === '') {
                    resultDetails.push({ row: rowNum, name: 'Unknown', status: 'error', message: 'Missing staff name' });
                    return;
                }

                const parsed = parseCSVRow(rowData, roles, venues);
                let warning = null;

                // Handle missing role
                if (!parsed.primary_role_id && roles.length > 0) {
                    const defaultRole = roles[0];
                    parsed.primary_role_id = defaultRole.id;
                    warning = `Role "${rowData.primary_role}" not found. Used default: ${defaultRole.name}`;
                }

                staffToInsert.push({
                    ...parsed,
                    secondary_roles: JSON.stringify(parsed.secondary_roles),
                    other_languages: JSON.stringify(parsed.other_languages),
                    special_skills: JSON.stringify(parsed.special_skills),
                    experience_tags: JSON.stringify(parsed.experience_tags)
                });

                successCount++;
                resultDetails.push({ row: rowNum, name: parsed.full_name, status: warning ? 'warning' : 'success', message: warning });

            } catch (e: any) {
                resultDetails.push({ row: rowNum, name: name, status: 'error', message: e.message });
            }
        });

        if (staffToInsert.length > 0) {
            db.transaction(() => {
                for (const staff of staffToInsert) {
                    insertStmt.run(staff);
                }
            })();
        }

        return NextResponse.json({
            success: true,
            count: successCount,
            details: resultDetails,
            warnings: resultDetails.filter(d => d.status === 'warning').map(d => `Row ${d.row}: ${d.message}`),
            errors: resultDetails.filter(d => d.status === 'error').map(d => `Row ${d.row}: ${d.message}`)
        });

    } catch (error: any) {
        console.error('[BULK IMPORT] Fatal error:', error);
        return NextResponse.json({
            error: 'Failed to import file: ' + error.message
        }, { status: 500 });
    }
}
