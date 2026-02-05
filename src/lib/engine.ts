import { Venue, StaffingRule, Event, StaffMember, Role } from '@/types';

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

        // Calculate peak guest count or sum? 
        // Instructions: "If multiple events overlap... sum requirements. If no time provided, assume overlap."
        // For simple MVP let's sum guest counts if they overlap, but since we are doing daily planner, 
        // let's assume valid total guest count for the "shift".
        // A better approach for MVP: Iterate through each event, calculate requirements, and aggregate max needed per role?
        // Or better: Sum guest counts for the day to get a "total load" for ratio rules?
        // The instruction says: "For each event... Compute required staff... Sum requirements if overlap"
        // Let's treat them as additive for now.

        const venueRules = rules.filter(r => Number(r.venue_id) === Number(venueId));
        log?.(`[Engine] Venue ${venueId} processing: ${venueEvents.length} events, ${venueRules.length} rules`);

        venueEvents.forEach(event => {
            venueRules.forEach(rule => {
                const role = roles.find(r => Number(r.id) === Number(rule.role_id));
                if (!role) {
                    log?.(`[Engine] Role ${rule.role_id} not found for rule`);
                    return;
                }

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

                log?.(`[Engine]   Event ${event.id} Rule Role=${role.name}: CalcCount=${count} (Ratio=${rule.ratio_guests}:${rule.ratio_staff}, Thresh=${rule.threshold_guests})`);

                if (count > 0) {
                    // Check if req already exists for this venue/role (generic aggregation)
                    const existing = requirements.find(r => r.venue_id === venueId && r.role_id === rule.role_id);
                    if (existing) {
                        existing.count += count;
                        existing.reasoning.push(...reasons);
                    } else {
                        requirements.push({
                            venue_id: venueId,
                            venue_name: venue.name,
                            role_id: rule.role_id,
                            role_name: role.name,
                            count,
                            reasoning: reasons
                        });
                    }
                }
            });
        });
    });

    return requirements;
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
