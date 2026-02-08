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
    availability_status: 'available' | 'off' | 'leave';
    notes?: string;
}

export type CreateStaffDTO = Omit<StaffMember, 'id'>;

export interface Event {
    id: number;
    date: string; // YYYY-MM-DD
    venue_id: number;
    guest_count: number;
    service_style_override?: string;
    special_requirements?: string;
    priority: 'low' | 'normal' | 'high';
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
