import { Venue, StaffingRule, Event, StaffMember, Role, ManningBracketRow } from '@/types';

export interface StaffRequirement {
    venue_id: number;
    venue_name: string;
    role_id: number;
    role_name: string;
    count: number;
    reasoning: string[];
}

export interface Assignment {
    venue_id: number;
    role_id: number;
    staff_id: number | null; // null if external/shortage
    staff_name: string;
    status: 'assigned' | 'shortage' | 'external';
    reason: string;
}

export interface DailyPlan {
    date: string;
    requirements: StaffRequirement[];
    assignments: Assignment[];
    shortages: { role_id: number; role_name: string; count: number; venue_id: number }[];
}


// --- Rule Engine ---

export function calculateRequirements(
    events: Event[],
    venues: Venue[],
    rules: StaffingRule[],
    roles: Role[],
    brackets: ManningBracketRow[] = [],
    log?: (msg: string) => void
): StaffRequirement[] {
    const requirements: StaffRequirement[] = [];

    // Group events by venue
    const eventsByVenue = new Map<number, Event[]>();
    events.forEach(e => {
        const list = eventsByVenue.get(e.venue_id) || [];
        list.push(e);
        eventsByVenue.set(e.venue_id, list);
    });

    eventsByVenue.forEach((venueEvents, venueId) => {
        const venue = venues.find(v => Number(v.id) === Number(venueId));
        if (!venue) {
            log?.(`[Engine] Venue ${venueId} not found in venue list`);
            return;
        }

        // Get all rules and brackets for this venue
        const venueRules = rules.filter(r => Number(r.venue_id) === Number(venueId));
        const venueBrackets = brackets.filter(b => Number(b.venue_id) === Number(venueId));

        log?.(`[Engine] Venue ${venueId} processing: ${venueEvents.length} events, ${venueRules.length} rules, ${venueBrackets.length} brackets`);

        // Identify all departments involved in this venue
        // Departments can come from Rules or Brackets
        const departments = new Set<string>();
        venueRules.forEach(r => departments.add(r.department.toLowerCase()));
        venueBrackets.forEach(b => departments.add(b.department.toLowerCase()));

        // For each event, calculate requirements per department
        venueEvents.forEach(event => {
            departments.forEach(dept => {
                let applied = false;

                // 1. Check Brackets for this Dept
                const deptBrackets = venueBrackets.filter(b => b.department.toLowerCase() === dept);
                if (deptBrackets.length > 0) {
                    // Find bracket matching guest count
                    const match = deptBrackets.find(b =>
                        event.guest_count >= b.guest_min &&
                        event.guest_count <= b.guest_max
                    );

                    if (match) {
                        log?.(`[Engine]   Event ${event.id} (${event.guest_count} pax) matched Bracket for ${dept}: ${match.guest_min}-${match.guest_max}`);
                        // Apply counts from bracket
                        for (const [roleIdStr, count] of Object.entries(match.counts)) {
                            const roleId = Number(roleIdStr);
                            const role = roles.find(r => r.id === roleId);
                            const finalCount = Number(count);

                            if (finalCount > 0 && role) {
                                // Add requirement
                                addRequirement(
                                    requirements,
                                    venueId,
                                    venue.name,
                                    roleId,
                                    role.name,
                                    finalCount,
                                    [`Bracket: ${match.guest_min}-${match.guest_max} pax (${event.guest_count} guests)`]
                                );
                            }
                        }
                        applied = true;
                    } else {
                        log?.(`[Engine]   Event ${event.id} (${event.guest_count} pax) has brackets for ${dept} but no match found.`);
                        applied = true; // Handled (result is 0)
                    }
                }

                // 2. Fallback to Ratio Rules if no brackets applied
                if (!applied) {
                    const deptRules = venueRules.filter(r => r.department.toLowerCase() === dept);
                    if (deptRules.length > 0) {
                        deptRules.forEach(rule => {
                            const role = roles.find(r => Number(r.id) === Number(rule.role_id));
                            if (!role) return;

                            let count = 0;
                            const reasons: string[] = [];

                            // Ratio Rule
                            if (rule.ratio_guests > 0 && rule.ratio_staff > 0) {
                                const ratioCount = Math.ceil(event.guest_count / rule.ratio_guests) * rule.ratio_staff;
                                count += ratioCount;
                                if (ratioCount > 0) reasons.push(`Ratio: 1/${rule.ratio_guests} guests (${event.guest_count} guests)`);
                            }

                            // Threshold Rule
                            if (rule.threshold_guests && event.guest_count >= rule.threshold_guests) {
                                const thresholdAdd = rule.threshold_staff || 0;
                                count += thresholdAdd;
                                reasons.push(`Threshold: >${rule.threshold_guests} guests (+${thresholdAdd})`);
                            }

                            // Minimum Rule
                            if (rule.min_required && count < rule.min_required) {
                                reasons.push(`Minimum required: ${rule.min_required}`);
                                count = rule.min_required;
                            }

                            if (count > 0) {
                                addRequirement(requirements, venueId, venue.name, rule.role_id, role.name, count, reasons);
                            }
                        });
                    }
                }
            });
        });
    });

    return requirements;
}

function addRequirement(
    requirements: StaffRequirement[],
    venueId: number,
    venueName: string,
    roleId: number,
    roleName: string,
    count: number,
    reasons: string[]
) {
    const existing = requirements.find(r => r.venue_id === venueId && r.role_id === roleId);
    if (existing) {
        existing.count += count;
        existing.reasoning.push(...reasons);
    } else {
        requirements.push({
            venue_id: venueId,
            venue_name: venueName,
            role_id: roleId,
            role_name: roleName,
            count,
            reasoning: reasons
        });
    }
}


// --- Allocation Engine ---

export function allocateStaff(
    requirements: StaffRequirement[],
    staff: StaffMember[]
): { assignments: Assignment[], shortages: any[] } {
    const assignments: Assignment[] = [];
    const shortages: any[] = [];

    // Filter available staff
    let availableStaff = staff.filter(s => s.availability_status === 'available');

    // Sort requirements? Maybe fill management first?
    // Let's just iterate.

    for (const req of requirements) {
        for (let i = 0; i < req.count; i++) {
            // Find best candidate
            // Criteria: 
            // 1. Home base match AND Primary Role match
            // 2. Primary Role match
            // 3. Secondary Role match

            let bestCandidateIndex = -1;
            let bestScore = -1;
            let reason = '';

            availableStaff.forEach((s, idx) => {
                let score = 0;
                let currentReason = '';

                const isHomeBase = s.home_base_venue_id === req.venue_id;
                const isPrimary = s.primary_role_id === req.role_id;
                const isSecondary = s.secondary_roles.includes(req.role_id);

                if (isPrimary) {
                    score += 10;
                    currentReason = 'Primary Role';
                } else if (isSecondary) {
                    score += 5;
                    currentReason = 'Secondary Role';
                } else {
                    return; // Not qualified
                }

                if (isHomeBase) {
                    score += 5;
                    currentReason += ', Home Base';
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestCandidateIndex = idx;
                    reason = currentReason;
                }
            });

            if (bestCandidateIndex !== -1) {
                const candidate = availableStaff[bestCandidateIndex];
                assignments.push({
                    venue_id: req.venue_id,
                    role_id: req.role_id,
                    staff_id: candidate.id,
                    staff_name: candidate.full_name,
                    status: 'assigned',
                    reason
                });
                // Remove from pool
                availableStaff.splice(bestCandidateIndex, 1);
            } else {
                // Shortage
                assignments.push({
                    venue_id: req.venue_id,
                    role_id: req.role_id,
                    staff_id: null,
                    staff_name: 'External / TBD',
                    status: 'shortage',
                    reason: 'No internal staff available'
                });
                shortages.push({
                    venue_id: req.venue_id,
                    role_id: req.role_id,
                    role_name: req.role_name,
                    count: 1
                });
            }
        }
    }

    return { assignments, shortages };
}
