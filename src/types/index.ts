export interface Venue {
    id: number;
    name: string;
    type: 'camp' | 'restaurant' | 'private' | 'other';
    default_service_style: 'sharing' | 'plated' | 'buffet' | 'cocktail' | 'other';
    notes?: string;
}

export interface Role {
    id: number;
    name: string;
    category: 'Serivce' | 'Bar' | 'Management' | 'Other';
}

export interface StaffingRule {
    id: number;
    venue_id: number;
    department: 'service' | 'bar' | 'other';
    role_id: number;
    ratio_guests: number; // e.g., 10
    ratio_staff: number; // e.g., 1
    threshold_guests?: number;
    threshold_staff?: number;
    min_required?: number;
    max_allowed?: number;
    notes?: string;
}

// Data Transfer Objects (for creation)
export type CreateVenueDTO = Omit<Venue, 'id'>;
export type CreateStaffingRuleDTO = Omit<StaffingRule, 'id'>;

export interface StaffMember {
    employee_role: string;
    id: number;
    full_name: string;
    primary_role_id: number;
    secondary_roles: number[]; // stored as JSON string in DB
    english_proficiency: 'basic' | 'medium' | 'good' | 'fluent';
    other_languages: Record<string, string>; // { "Spanish": "fluent" }
    special_skills: string[];
    experience_tags: string[];
    home_base_venue_id?: number;
    employment_type: 'internal' | 'external' | 'freelancer';
    availability_status: 'available' | 'off-duty' | 'in-event' | 'leave';
    phone?: string;
    current_event_id?: number;
    working_hours?: number;
    notes?: string;
}

export type CreateStaffDTO = Omit<StaffMember, 'id'>;

export interface Event {
    id: number;
    event_name?: string;
    date: string; // YYYY-MM-DD
    venue_id: number;
    guest_count: number;
    service_style_override?: string;
    special_requirements?: string;
    priority: 'normal' | 'vip' | 'vvip';
    start_time?: string; // HH:MM
    end_time?: string; // HH:MM
    venue_name?: string; // Joined from venues table
}

export type CreateEventDTO = Omit<Event, 'id'>;

export interface ManningBracketRow {
    id: number;
    venue_id: number;
    department: string;
    guest_min: number;
    guest_max: number;
    counts: Record<number, number>; // Hydrated from counts_json
    notes?: string;
    source?: 'manual' | 'excel';
}

export interface PlanAssignment {
    role_id: number;
    role_name: string;
    staff_id: number;
    staff_name: string;
    status: 'confirmed' | 'pending' | 'declined';
    shift_start?: string;
    shift_end?: string;
    is_freelance: boolean;
}

export interface PlanRequirement {
    role_id: number;
    role_name: string;
    count: number;
    filled: number;
    assignments: PlanAssignment[];
}

export interface Plan {
    id?: number;
    event_id: number;
    event_date: string;
    venue_name: string;
    guest_count: number;
    requirements: PlanRequirement[];
    total_staff: number;
    total_freelancers: number;
    status: 'draft' | 'finalized';
    created_at?: string;
}

// ============ Plan Generation Module Types ============

export interface GeneratedPlan {
    id: number;
    event_id: number;
    generated_by: number;
    generated_at: string;
    status: 'draft' | 'active' | 'completed' | 'archived';
    version: number;
    regeneration_reason?: string;
    plan_data: string; // JSON string
}

export interface Freelancer {
    id: number;
    name: string;
    phone: string;
    role?: string;
    skills?: string;
    notes?: string;
    created_at?: string;
}

export interface EmployeeAssignment {
    id: number;
    employee_id: number;
    event_id: number;
    plan_id?: number;
    date: string;
    start_time: string;
    end_time: string;
    hours_worked: number;
    status: 'assigned' | 'confirmed' | 'unavailable' | 'completed';
    created_at?: string;
}

export interface PlanActivityLog {
    id: number;
    plan_id: number;
    event_id: number;
    action: 'generated' | 'regenerated' | 'employee_confirmed' | 'employee_unavailable' | 'freelancer_added' | 'plan_saved' | 'plan_exported';
    reason?: string;
    performed_by: number;
    performed_at: string;
    changes?: string;
}

export interface EmployeeAvailability {
    available: boolean;
    hours_worked: number;
    hours_remaining: number;
    current_events: string[];
    status: 'available' | 'limited' | 'unavailable';
}
