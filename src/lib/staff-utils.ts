import { StaffMember } from '@/types';

/**
 * Extracts phone number from notes field using the Phone:+971... pattern
 */
export function extractPhone(notes: string | undefined | null): string | null {
    if (!notes) return null;
    const match = notes.match(/Phone:\s*([+\d\s-]+)/i);
    return match ? match[1].trim() : null;
}

/**
 * Updates or adds phone number to notes field using the Phone:... pattern
 * Preserves other text in notes.
 */
export function updatePhoneInNotes(notes: string | undefined | null, newPhone: string): string {
    const phoneEntry = `Phone:${newPhone}`;
    if (!notes) return phoneEntry;

    const phoneRegex = /Phone:\s*[+\d\s-]+/i;
    if (phoneRegex.test(notes)) {
        return notes.replace(phoneRegex, phoneEntry);
    } else {
        return `${notes}\n${phoneEntry}`.trim();
    }
}

/**
 * Exports staff list to CSV and triggers a browser download
 */
export function exportToCSV(staff: StaffMember[], roles: { id: number, name: string }[], venues: { id: number, name: string }[]) {
    const headers = ['Name', 'Role', 'Home Base', 'English', 'Status', 'Employment Type', 'Phone', 'Notes'];

    const rows = staff.map(s => {
        const roleName = roles.find(r => r.id === s.primary_role_id)?.name || '-';
        const venueName = venues.find(v => v.id === s.home_base_venue_id)?.name || '-';
        const phone = extractPhone(s.notes) || '';

        return [
            s.full_name,
            roleName,
            venueName,
            s.english_proficiency,
            s.availability_status,
            s.employment_type,
            phone,
            (s.notes || '').replace(/Phone:.*(\n|$)/i, '').replace(/\n/g, ' ').trim()
        ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `nara_staff_roster_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Generates a blank CSV template for staff import
 */
export function downloadCSVTemplate() {
    const headers = [
        'full_name',
        'phone_number',
        'primary_role',
        'secondary_roles',
        'english_proficiency',
        'other_languages',
        'special_skills',
        'home_base_venue',
        'employment_type',
        'availability_status',
        'notes'
    ];

    const comments = [
        '# ROLES: Waiter, Runner, Supervisor, Manager, Bartender, Barback, Bar Supervisor, Sommelier, Host, Cashier, Busser, Head Waiter',
        '# VENUES: SONARA, NEST, LADY NARA',
        '# ENGLISH: basic, medium, good, fluent',
        '# EMPLOYMENT: internal, external, freelancer',
        '# STATUS: available, off, leave'
    ];

    const examples = [
        ['John Doe', '+971501234567', 'Waiter', 'Bartender', 'good', 'French,Spanish', 'First Aid,VIP', 'SONARA', 'internal', 'available', 'Experienced server'],
        ['Jane Smith', '+971509876543', 'Manager', '', 'fluent', 'Arabic', 'Leadership', 'NEST', 'internal', 'available', 'Guest relations specialist'],
        ['Alex Brown', '+971505554433', 'Bartender', 'Waiter', 'medium', '', 'Mixology', 'LADY NARA', 'freelancer', 'available', 'Part-time support']
    ];

    const csvContent = [
        headers.join(','),
        ...examples.map(row => row.map(v => `"${v}"`).join(',')),
        '',
        ...comments
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'nara_staff_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Exports a generated staffing plan to CSV
 */
import { Plan, PlanAssignment } from '@/types';

export function exportPlanToCSV(plan: Plan, assignments: PlanAssignment[]) {
    const headers = ['Role', 'Staff Name', 'Type', 'Status'];

    // Sort assignments by role name
    const sorted = [...assignments].sort((a, b) => a.role_name.localeCompare(b.role_name));

    const rows = sorted.map(a => [
        a.role_name,
        a.staff_name,
        a.is_freelance ? 'Freelancer' : 'Internal',
        a.status
    ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','));

    // Plan info header
    const planInfo = [
        [`"Venue: ${plan.venue_name}"`],
        [`"Date: ${plan.event_date}"`],
        [`"Guest Count: ${plan.guest_count}"`],
        [''], // empty row
        [headers.join(',')]
    ].map(r => r.join(',')).join('\n');

    const csvContent = planInfo + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `nara_plan_${plan.venue_name.replace(/\s+/g, '_').toLowerCase()}_${plan.event_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
