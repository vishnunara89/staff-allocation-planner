/**
 * Employee Availability Utilities
 * Checks employee working hours and availability for a given date
 */

import type { Database as DatabaseType } from 'better-sqlite3';
import { EmployeeAvailability } from '@/types';

const MAX_HOURS_PER_DAY = 12;
const OPTIMAL_HOURS = 8;

interface AssignmentRow {
    hours_worked: number;
    status: string;
    event_name: string | null;
    event_id: number;
}

/**
 * Calculate availability for a single employee on a given date
 */
export function calculateEmployeeAvailability(
    db: DatabaseType,
    employeeId: number,
    date: string
): EmployeeAvailability {
    // Get all assignments for this employee on the target date
    const assignments = db.prepare(`
        SELECT ea.hours_worked, ea.status, e.event_name, ea.event_id
        FROM employee_assignments ea
        LEFT JOIN events e ON ea.event_id = e.id
        WHERE ea.employee_id = ? AND ea.date = ?
        AND ea.status NOT IN ('completed', 'unavailable')
    `).all(employeeId, date) as AssignmentRow[];

    const totalHoursWorked = assignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
    const hoursRemaining = Math.max(0, MAX_HOURS_PER_DAY - totalHoursWorked);
    const currentEvents = assignments
        .map(a => a.event_name || `Event #${a.event_id}`)
        .filter(Boolean);

    let status: 'available' | 'limited' | 'unavailable';
    let available: boolean;

    if (totalHoursWorked >= MAX_HOURS_PER_DAY) {
        status = 'unavailable';
        available = false;
    } else if (totalHoursWorked >= OPTIMAL_HOURS) {
        status = 'limited';
        available = true; // Can still work up to 12h
    } else {
        status = 'available';
        available = true;
    }

    return {
        available,
        hours_worked: totalHoursWorked,
        hours_remaining: hoursRemaining,
        current_events: currentEvents,
        status
    };
}

/**
 * Get availability for all employees on a given date
 */
export function getEmployeesWithAvailability(
    db: DatabaseType,
    date: string
): Map<number, EmployeeAvailability> {
    const result = new Map<number, EmployeeAvailability>();

    // Batch query: get all assignments for the date
    const allAssignments = db.prepare(`
        SELECT ea.employee_id, ea.hours_worked, ea.status, e.event_name, ea.event_id
        FROM employee_assignments ea
        LEFT JOIN events e ON ea.event_id = e.id
        WHERE ea.date = ?
        AND ea.status NOT IN ('completed', 'unavailable')
    `).all(date) as (AssignmentRow & { employee_id: number })[];

    // Group by employee
    const grouped = new Map<number, AssignmentRow[]>();
    allAssignments.forEach(a => {
        const list = grouped.get(a.employee_id) || [];
        list.push(a);
        grouped.set(a.employee_id, list);
    });

    // Calculate availability for each
    grouped.forEach((assignments, employeeId) => {
        const totalHoursWorked = assignments.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
        const hoursRemaining = Math.max(0, MAX_HOURS_PER_DAY - totalHoursWorked);
        const currentEvents = assignments
            .map(a => a.event_name || `Event #${a.event_id}`)
            .filter(Boolean);

        let status: 'available' | 'limited' | 'unavailable';
        let available: boolean;

        if (totalHoursWorked >= MAX_HOURS_PER_DAY) {
            status = 'unavailable';
            available = false;
        } else if (totalHoursWorked >= OPTIMAL_HOURS) {
            status = 'limited';
            available = true;
        } else {
            status = 'available';
            available = true;
        }

        result.set(employeeId, {
            available,
            hours_worked: totalHoursWorked,
            hours_remaining: hoursRemaining,
            current_events: currentEvents,
            status
        });
    });

    return result;
}

/**
 * Calculate hours between two time strings (HH:MM format)
 */
export function calculateHours(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let hours = (eh * 60 + em - sh * 60 - sm) / 60;
    if (hours < 0) hours += 24; // Handle overnight shifts
    return Math.round(hours * 100) / 100;
}
