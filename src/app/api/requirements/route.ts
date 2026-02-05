import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // 1. Fetch official catalog
        const catalog = db.prepare('SELECT type, value FROM requirements_catalog').all() as { type: string, value: string }[];

        // 2. Fetch unique skills/languages from Staff
        const staffRows = db.prepare('SELECT other_languages, special_skills, english_proficiency FROM staff').all() as any[];

        const staffSkills = new Set<string>();
        const staffLanguages = new Set<string>();

        staffRows.forEach(row => {
            // Languages
            try {
                const langs = JSON.parse(row.other_languages || '{}');
                Object.keys(langs).forEach(l => staffLanguages.add(l));
            } catch (e) { }

            // Skills
            try {
                const skills = JSON.parse(row.special_skills || '[]');
                if (Array.isArray(skills)) skills.forEach(s => staffSkills.add(s));
            } catch (e) { }

            // English? Maybe treat as language option "English"
            if (row.english_proficiency) {
                // optional: staffLanguages.add(`English (${row.english_proficiency})`);
            }
        });

        // 3. Merge
        const options = [];

        // Add Catalog items
        catalog.forEach(c => options.push({ ...c, source: 'catalog' }));

        // Add Staff items (avoid duplicates)
        staffLanguages.forEach(l => {
            if (!options.find(o => o.type === 'language' && o.value.toLowerCase() === l.toLowerCase())) {
                options.push({ type: 'language', value: l, source: 'staff' });
            }
        });

        staffSkills.forEach(s => {
            if (!options.find(o => o.type === 'skill' && o.value.toLowerCase() === s.toLowerCase())) {
                options.push({ type: 'skill', value: s, source: 'staff' });
            }
        });

        // 4. Calculate Availability Counts (Internal)
        // We need to loop again or doing it efficiently?
        // Let's do a quick pass for internal counts
        options.forEach((opt: any) => {
            let count = 0;
            staffRows.forEach(row => {
                // Check avail status
                // if (row.availability_status !== 'available') return; // Strict availability? Or general capability?
                // Prompt says: "available_internal_count = number of staff (availability_status=available) matching"
                if ((row.availability_status || 'available') !== 'available') return;

                if (opt.type === 'language') {
                    const langs = JSON.parse(row.other_languages || '{}');
                    if (langs[opt.value]) count++;
                } else if (opt.type === 'skill') {
                    const skills = JSON.parse(row.special_skills || '[]');
                    if (skills.includes(opt.value)) count++;
                }
            });
            opt.available_internal = count;
        });

        return NextResponse.json(options);

    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.type || !body.value) {
            return NextResponse.json({ error: 'Type and Value required' }, { status: 400 });
        }

        const stmt = db.prepare('INSERT INTO requirements_catalog (type, value) VALUES (@type, @value)');
        const result = stmt.run({ type: body.type, value: body.value });

        return NextResponse.json({ id: result.lastInsertRowid, ...body, source: 'catalog', available_internal: 0 }); // assume 0 for new until refresh
    } catch (error) {
        // check constraint violation
        return NextResponse.json({ error: 'Failed to add option (might exist)' }, { status: 500 });
    }
}
