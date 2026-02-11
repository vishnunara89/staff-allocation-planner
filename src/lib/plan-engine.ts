/**
 * Intelligent Plan Generation Engine
 * 
 * Generates optimal staffing plans based on:
 * - Venue manning tables (PAX brackets)
 * - Employee skills, roles, languages
 * - Event priority (normal/VIP/VVIP)
 * - Employee availability and working hours
 * 
 * Coexists with existing engine.ts (which handles ratio-based calculations)
 */

import type { Database as DatabaseType } from 'better-sqlite3';
import { Event, StaffMember, Role, PlanRequirement, PlanAssignment } from '@/types';
import { getEmployeesWithAvailability, calculateHours } from './availability-utils';

interface ManningTableConfig {
    brackets: string[];
    rows: { role: string; counts: number[] }[];
}

interface ManningTableRow {
    id: number;
    venue_id: number;
    department: string;
    config: ManningTableConfig;
}

export interface PlanGenerationResult {
    event: Event;
    venue_name: string;
    requirements: PlanRequirement[];
    total_staff_needed: number;
    internal_assigned: number;
    freelancers_needed: number;
    shortages: { role_name: string; count: number }[];
    logs: string[];
}

/**
 * Parse a StaffMember from a raw DB row
 */
function parseStaffRow(row: any): StaffMember {
    return {
        ...row,
        secondary_roles: row.secondary_roles ? (typeof row.secondary_roles === 'string' ? JSON.parse(row.secondary_roles) : row.secondary_roles) : [],
        other_languages: row.other_languages ? (typeof row.other_languages === 'string' ? JSON.parse(row.other_languages) : row.other_languages) : {},
        special_skills: row.special_skills ? (typeof row.special_skills === 'string' ? JSON.parse(row.special_skills) : row.special_skills) : [],
        experience_tags: row.experience_tags ? (typeof row.experience_tags === 'string' ? JSON.parse(row.experience_tags) : row.experience_tags) : [],
    };
}

/**
 * Main plan generation function
 */
export function generatePlanForEvent(
    db: DatabaseType,
    event: Event,
    userId: number
): PlanGenerationResult {
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[PlanEngine] ${msg}`); };

    log(`Generating plan for Event #${event.id} (${event.event_name || 'Unnamed'}) — ${event.guest_count} PAX, Priority: ${event.priority}`);

    // 1. Get venue info
    const venue = db.prepare('SELECT * FROM venues WHERE id = ?').get(event.venue_id) as any;
    if (!venue) {
        throw new Error(`Venue #${event.venue_id} not found`);
    }
    const venueName = venue.name;
    log(`Venue: ${venueName}`);

    // 2. Get roles
    const roles = db.prepare('SELECT * FROM roles').all() as Role[];
    const getRoleName = (id: number) => roles.find(r => r.id === id)?.name || 'Staff';
    const getRoleId = (name: string) => {
        const role = roles.find(r => r.name.toUpperCase().trim() === name.toUpperCase().trim());
        return role?.id || null;
    };

    // 3. Get manning tables for this venue
    const manningTables = db.prepare(
        'SELECT * FROM manning_tables WHERE venue_id = ?'
    ).all(event.venue_id) as any[];

    // 4. Get staffing_rules as fallback
    const staffingRules = db.prepare(
        'SELECT * FROM staffing_rules WHERE venue_id = ?'
    ).all(event.venue_id) as any[];

    // Also try manning_brackets
    const manningBrackets = db.prepare(
        'SELECT * FROM manning_brackets WHERE venue_id = ?'
    ).all(event.venue_id) as any[];

    // 5. Calculate requirements
    const reqMap = new Map<number, { count: number; roleName: string }>();

    if (manningTables.length > 0) {
        // Use manning tables (Excel-based)
        log(`Using Manning Tables: ${manningTables.length} found`);

        manningTables.forEach((table: any) => {
            let config: ManningTableConfig;
            try {
                config = typeof table.config === 'string' ? JSON.parse(table.config) : table.config;
            } catch {
                log(`Failed to parse manning table config for table #${table.id}`);
                return;
            }

            // Find matching bracket
            let bracketIndex = -1;
            for (let i = 0; i < config.brackets.length; i++) {
                const parts = config.brackets[i].split('-').map(Number);
                const min = parts[0];
                const max = parts[1] || Infinity;
                if (event.guest_count >= min && (event.guest_count <= max || i === config.brackets.length - 1)) {
                    bracketIndex = i;
                    break;
                }
            }

            if (bracketIndex !== -1) {
                log(`Matched bracket: ${config.brackets[bracketIndex]} for ${event.guest_count} PAX`);
                config.rows.forEach(row => {
                    const roleId = getRoleId(row.role);
                    if (roleId && row.counts[bracketIndex] > 0) {
                        const existing = reqMap.get(roleId);
                        const count = row.counts[bracketIndex];
                        reqMap.set(roleId, {
                            count: (existing?.count || 0) + count,
                            roleName: getRoleName(roleId)
                        });
                    }
                });
            } else {
                log(`No bracket match for ${event.guest_count} PAX`);
            }
        });
    } else if (manningBrackets.length > 0) {
        // Use manning_brackets table
        log(`Using Manning Brackets: ${manningBrackets.length} found`);

        manningBrackets.forEach((bracket: any) => {
            if (event.guest_count >= bracket.guest_min && event.guest_count <= bracket.guest_max) {
                let counts: Record<string, number>;
                try {
                    counts = typeof bracket.counts_json === 'string' ? JSON.parse(bracket.counts_json) : (bracket.counts || {});
                } catch {
                    return;
                }

                for (const [roleIdStr, count] of Object.entries(counts)) {
                    const roleId = Number(roleIdStr);
                    if (count > 0) {
                        const existing = reqMap.get(roleId);
                        reqMap.set(roleId, {
                            count: (existing?.count || 0) + Number(count),
                            roleName: getRoleName(roleId)
                        });
                    }
                }
            }
        });
    } else if (staffingRules.length > 0) {
        // Fallback to ratio rules
        log(`Fallback to Staffing Rules: ${staffingRules.length} found`);

        staffingRules.forEach((rule: any) => {
            let count = 0;
            if (rule.ratio_guests > 0 && rule.ratio_staff > 0) {
                count = Math.ceil(event.guest_count / rule.ratio_guests) * rule.ratio_staff;
            }
            if (rule.min_required && count < rule.min_required) {
                count = rule.min_required;
            }
            if (count > 0) {
                const existing = reqMap.get(rule.role_id);
                reqMap.set(rule.role_id, {
                    count: (existing?.count || 0) + count,
                    roleName: getRoleName(rule.role_id)
                });
            }
        });
    } else {
        log('⚠️ No manning tables or staffing rules found for this venue');
    }

    log(`Requirements: ${reqMap.size} roles found`);

    // 6. Get available employees
    const staffRows = db.prepare(`
        SELECT * FROM employees
        WHERE availability_status = 'available'
    `).all();
    const allStaff = staffRows.map(parseStaffRow);
    log(`Available employees: ${allStaff.length}`);

    // 7. Get availability data for the event date
    const availabilityMap = getEmployeesWithAvailability(db, event.date);

    // 8. Calculate event duration for hours tracking
    const eventHours = (event.start_time && event.end_time)
        ? calculateHours(event.start_time, event.end_time)
        : 8; // Default 8 hours if times not specified

    // 9. Filter staff based on availability and hours
    const eligibleStaff = allStaff.filter(s => {
        const avail = availabilityMap.get(s.id);
        if (avail && !avail.available) {
            log(`  ✗ ${s.full_name}: Unavailable (${avail.hours_worked}h worked)`);
            return false;
        }
        if (avail && avail.hours_remaining < eventHours) {
            log(`  ⚠ ${s.full_name}: Limited (${avail.hours_remaining}h remaining, need ${eventHours}h)`);
            return false;
        }
        return true;
    });

    log(`Eligible staff after availability check: ${eligibleStaff.length}`);

    // 10. Parse event special requirements
    let requiredSkills: string[] = [];
    let requiredLanguages: Record<string, string> = {};
    if (event.special_requirements) {
        try {
            const specialReqs = JSON.parse(event.special_requirements);
            if (specialReqs.skills) requiredSkills = specialReqs.skills;
            if (specialReqs.languages) requiredLanguages = specialReqs.languages;
        } catch {
            // Not JSON, ignore
        }
    }

    // 11. Smart Assignment Algorithm
    const assignedStaffIds = new Set<number>();
    const requirements: PlanRequirement[] = [];
    const shortages: { role_name: string; count: number }[] = [];

    reqMap.forEach(({ count, roleName }, roleId) => {
        const assignments: PlanAssignment[] = [];
        let needed = count;

        // Score and sort candidates for this role
        const candidates = eligibleStaff
            .filter(s => !assignedStaffIds.has(s.id))
            .map(s => ({
                staff: s,
                score: calculateMatchScore(s, roleId, event, requiredSkills, requiredLanguages)
            }))
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score);

        // Assign best candidates
        for (const candidate of candidates) {
            if (needed <= 0) break;

            assignedStaffIds.add(candidate.staff.id);
            assignments.push({
                role_id: roleId,
                role_name: roleName,
                staff_id: candidate.staff.id,
                staff_name: candidate.staff.full_name,
                status: 'pending',
                is_freelance: false,
                shift_start: event.start_time,
                shift_end: event.end_time
            });
            needed--;
            log(`  ✓ Assigned ${candidate.staff.full_name} as ${roleName} (score: ${candidate.score})`);
        }

        // Record freelancer needs for remaining gaps
        if (needed > 0) {
            for (let i = 0; i < needed; i++) {
                assignments.push({
                    role_id: roleId,
                    role_name: roleName,
                    staff_id: -Math.random(),
                    staff_name: 'Freelancer Needed',
                    status: 'pending',
                    is_freelance: true
                });
            }
            shortages.push({ role_name: roleName, count: needed });
            log(`  ⚠ ${roleName}: ${needed} freelancers needed`);
        }

        requirements.push({
            role_id: roleId,
            role_name: roleName,
            count,
            filled: count - needed,
            assignments
        });
    });

    const totalStaffNeeded = requirements.reduce((sum, r) => r.count + sum, 0);
    const internalAssigned = requirements.reduce((sum, r) => sum + r.assignments.filter(a => !a.is_freelance).length, 0);
    const freelancersNeeded = totalStaffNeeded - internalAssigned;

    log(`\nSummary: ${totalStaffNeeded} needed, ${internalAssigned} internal, ${freelancersNeeded} freelancers`);

    return {
        event,
        venue_name: venueName,
        requirements,
        total_staff_needed: totalStaffNeeded,
        internal_assigned: internalAssigned,
        freelancers_needed: freelancersNeeded,
        shortages,
        logs
    };
}

/**
 * Calculate a match score for an employee against a role/event
 * Higher score = better match
 */
function calculateMatchScore(
    staff: StaffMember,
    roleId: number,
    event: Event,
    requiredSkills: string[],
    requiredLanguages: Record<string, string>
): number {
    let score = 0;

    // Role match
    const isPrimary = staff.primary_role_id === roleId;
    const isSecondary = Array.isArray(staff.secondary_roles) && staff.secondary_roles.includes(roleId);

    if (isPrimary) {
        score += 20;
    } else if (isSecondary) {
        score += 10;
    } else {
        return 0; // Not qualified for this role
    }

    // Home base match
    if (staff.home_base_venue_id === event.venue_id) {
        score += 15;
    }

    // Internal staff preference
    if (staff.employment_type === 'internal') {
        score += 5;
    }

    // Skill match
    if (requiredSkills.length > 0) {
        const staffSkills = Array.isArray(staff.special_skills)
            ? staff.special_skills.map(s => s.toLowerCase())
            : [];
        const matchedSkills = requiredSkills.filter(s =>
            staffSkills.includes(s.toLowerCase())
        );
        score += matchedSkills.length * 5;
    }

    // Language match with priority filtering
    if (Object.keys(requiredLanguages).length > 0) {
        const staffLangs = (typeof staff.other_languages === 'object' && staff.other_languages !== null)
            ? staff.other_languages
            : {};

        for (const [lang, _minProficiency] of Object.entries(requiredLanguages)) {
            const hasLang = staffLangs[lang];
            if (hasLang) {
                score += 8;
                // Bonus for higher proficiency
                const proficiencyScore: Record<string, number> = {
                    'basic': 1, 'conversational': 2, 'fluent': 3, 'native': 4
                };
                score += (proficiencyScore[hasLang] || 0) * 2;
            }
        }
    }

    // Priority-based language quality filter
    if (event.priority === 'vvip') {
        // VVIP: Check if staff has fluent/native English
        const engScore: Record<string, number> = {
            'basic': -10, 'medium': -5, 'good': 2, 'fluent': 5
        };
        score += engScore[staff.english_proficiency] || 0;
    } else if (event.priority === 'vip') {
        // VIP: Prefer good+ English
        if (staff.english_proficiency === 'good' || staff.english_proficiency === 'fluent') {
            score += 3;
        }
    }

    return score;
}
