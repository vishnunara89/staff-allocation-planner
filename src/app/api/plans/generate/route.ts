import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateRequirements, allocateStaff } from '@/lib/engine';
import { Event, Venue, StaffingRule, Role, StaffMember } from '@/types';

function parseStaff(row: any): StaffMember {
    return {
        ...row,
        secondary_roles: row.secondary_roles ? JSON.parse(row.secondary_roles) : [],
        other_languages: row.other_languages ? JSON.parse(row.other_languages) : {},
        special_skills: row.special_skills ? JSON.parse(row.special_skills) : [],
        experience_tags: row.experience_tags ? JSON.parse(row.experience_tags) : []
    };
}

export async function POST(request: Request) {
    try {
        const { date } = await request.json();

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        // Debug logging setup
        const logs: string[] = [];
        const log = (msg: string) => { logs.push(msg); console.log(msg); };

        log(`[PlanGen] Date: ${date}`);

        // 1. Fetch Data
        const events = db.prepare('SELECT * FROM events WHERE date = ?').all(date) as Event[];
        const venues = db.prepare('SELECT * FROM venues').all() as Venue[];
        const rules = db.prepare('SELECT * FROM staffing_rules').all() as StaffingRule[];
        const roles = db.prepare('SELECT * FROM roles').all() as Role[];
        const staffRows = db.prepare('SELECT * FROM staff').all();
        const staff = staffRows.map(parseStaff);

        log(`[PlanGen] Fetched: ${events.length} events, ${venues.length} venues, ${rules.length} rules, ${roles.length} roles`);

        events.forEach(e => {
            log(`[PlanGen] Event: ID=${e.id}, VenueID=${e.venue_id} (type: ${typeof e.venue_id}), Guests=${e.guest_count}`);
        });

        const venueIdsInEvents = [...new Set(events.map(e => e.venue_id))];
        log(`[PlanGen] Venue IDs in events: ${JSON.stringify(venueIdsInEvents)}`);

        venueIdsInEvents.forEach(vid => {
            const rulesForVenue = rules.filter(r => r.venue_id == vid); // Loose check for logging
            log(`[PlanGen] Rules for Venue ${vid}: ${rulesForVenue.length} found`);
            rulesForVenue.forEach(r => {
                log(`[PlanGen]   Rule: RoleID=${r.role_id}, Ratio=${r.ratio_guests}:${r.ratio_staff}, Threshold=${r.threshold_guests}`);
            });
        });

        // 2. Validate essential data
        if (venues.length === 0) log('[PlanGen] No venues found in DB');
        if (rules.length === 0) log('[PlanGen] No staffing rules found in DB');

        // 3. Run Engine
        let requirements: any[] = [];
        let assignments: any[] = [];
        let shortages: any[] = [];

        try {
            log('[PlanGen] Starting calculation...');
            requirements = calculateRequirements(events, venues, rules, roles, log);
            log(`[PlanGen] Calculation done. Requirements: ${requirements.length}`);
            requirements.forEach(req => {
                log(`[PlanGen]   Req: Venue=${req.venue_id}, Role=${req.role_name}, Count=${req.count}`);
            });

            log('[PlanGen] Starting allocation...');
            const allocation = allocateStaff(requirements, staff);
            assignments = allocation.assignments;
            shortages = allocation.shortages;
        } catch (engineErr) {
            console.error('[PlanGen] Engine calculation failed:', engineErr);
            return NextResponse.json({
                error: 'Failed to calculate staffing requirements. Please check venue rules.',
                logs
            }, { status: 500 });
        }


        // 4. Check results
        let message = '';
        if (requirements.length === 0) {
            // Detailed diagnostics
            const venueIds = events.map(e => e.venue_id);
            const venuesWithRules = rules.map(r => r.venue_id);

            // Check 1: Do the venues have ANY rules?
            const missingRulesVenues = venueIds.filter(vid => !venuesWithRules.includes(vid));
            const hasAnyRules = venuesWithRules.length > 0;
            const relevantRulesExist = rules.some(r => venueIds.includes(r.venue_id));

            if (!relevantRulesExist) {
                if (missingRulesVenues.length > 0) {
                    // Get names
                    const missingNames = venues.filter(v => missingRulesVenues.includes(v.id)).map(v => v.name).join(', ');
                    message = `Events are scheduled at venues (${missingNames}) that have NO staffing rules defined.`;
                } else {
                    message = 'Events exist, but no staffing rules overlap with these venues.';
                }
            } else {
                message = 'Events exist and rules exist, but the specific guest counts or thresholds did not trigger any staffing requirements.';
            }
        }

        return NextResponse.json({
            date,
            requirements,
            assignments,
            shortages,
            message
        });

    } catch (error) {
        console.error('Plan generation error:', error);
        return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
    }
}
