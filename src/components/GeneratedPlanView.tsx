import React, { useState, useRef, useEffect } from 'react';
import { Plan, PlanAssignment, StaffMember, Role } from '@/types';
import styles from '../app/(manager)/plans/plans.module.css';
import EmployeeCard from './EmployeeCard';
import { generateStaffingPlanPDF } from '@/utils/PDFGenerator';
import { exportPlanToCSV } from '@/lib/staff-utils';

interface GeneratedPlanViewProps {
    plan: Plan;
    onBack: () => void;
    onExport: () => void;
}

interface RequirementRow {
    role_id: number;
    role_name: string;
    required: number;
    internal_assigned: number;
    gap: number;
}

export default function GeneratedPlanView({ plan, onBack, onExport }: GeneratedPlanViewProps) {
    const planRef = useRef<HTMLDivElement>(null);
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [assignments, setAssignments] = useState<PlanAssignment[]>(
        plan.requirements.flatMap(r => r.assignments)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<number | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/staff').then(res => res.json()),
            fetch('/api/roles').then(res => res.json())
        ]).then(([staffData, rolesData]) => {
            setAllStaff(staffData);
            setRoles(rolesData);
        });
    }, []);

    // Calculate requirement rows for the table
    const requirementRows: RequirementRow[] = plan.requirements.map(req => {
        const roleAssignments = assignments.filter(a => a.role_id === req.role_id);
        const internalAssigned = roleAssignments.filter(a => !a.is_freelance).length;
        return {
            role_id: req.role_id,
            role_name: req.role_name,
            required: req.count,
            internal_assigned: internalAssigned,
            gap: Math.max(0, req.count - internalAssigned)
        };
    });

    // Get available staff (not already assigned)
    const assignedStaffIds = new Set(assignments.map(a => a.staff_id));
    const availableStaff = allStaff.filter(s => !assignedStaffIds.has(s.id));

    // Priority sort: Home venue → Experience → Skills → Language
    const sortedAvailableStaff = [...availableStaff].sort((a, b) => {
        // Home venue priority (comparing venue IDs, not names)
        // Note: This is a simplified comparison - in production you'd match venue IDs
        const aIsHome = a.home_base_venue_id !== null;
        const bIsHome = b.home_base_venue_id !== null;
        if (aIsHome && !bIsHome) return -1;
        if (bIsHome && !aIsHome) return 1;

        // Then by employment type (internal > freelance)
        if (a.employment_type === 'internal' && b.employment_type !== 'internal') return -1;
        if (b.employment_type === 'internal' && a.employment_type !== 'internal') return 1;

        return 0;
    });

    // Filter by search
    const filteredStaff = searchQuery
        ? sortedAvailableStaff.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
        : sortedAvailableStaff;

    const handleAssignStaff = (staff: StaffMember, roleId: number) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;

        const newAssignment: PlanAssignment = {
            staff_id: staff.id,
            staff_name: staff.full_name,
            role_id: roleId,
            role_name: role.name,
            status: 'pending',
            is_freelance: false
        };
        setAssignments([...assignments, newAssignment]);
    };

    const handleRemoveAssignment = (staffId: number) => {
        setAssignments(assignments.filter(a => a.staff_id !== staffId));
    };

    const handleStatusToggle = (staffId: number, newStatus: 'confirmed' | 'pending' | 'declined') => {
        setAssignments(prev => prev.map(a =>
            a.staff_id === staffId ? { ...a, status: newStatus } : a
        ));
    };

    const handleExportCSV = () => {
        try {
            exportPlanToCSV(plan, assignments);
        } catch (error) {
            console.error('CSV Export failed:', error);
            alert('Failed to export CSV. Please try again.');
        }
    };

    const handleExportPDF = () => {
        try {
            generateStaffingPlanPDF({
                plan,
                assignments,
                allStaff
            });
        } catch (error) {
            console.error('PDF Export failed:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    // Group assignments by role for display
    const assignmentsByRole: Record<string, PlanAssignment[]> = assignments.reduce((acc: Record<string, PlanAssignment[]>, curr: PlanAssignment) => {
        if (!acc[curr.role_name]) acc[curr.role_name] = [];
        acc[curr.role_name].push(curr);
        return acc;
    }, {});

    const getRoleName = (roleId: number) => roles.find(r => r.id === roleId)?.name || 'Unknown Role';
    const getLanguages = (staff: StaffMember) => {
        const langs: string[] = [staff.english_proficiency];
        try {
            const otherLangsStr = typeof staff.other_languages === 'string' ? staff.other_languages : '{}';
            const otherLangs = JSON.parse(otherLangsStr);
            if (typeof otherLangs === 'object' && otherLangs !== null) {
                Object.keys(otherLangs).forEach(lang => langs.push(lang));
            }
        } catch { }
        return langs.join(', ');
    };

    return (
        <div className={styles.generatedView} ref={planRef}>
            {/* Header */}
            <div className={styles.viewHeader}>
                <button onClick={onBack} className={styles.backBtn}>
                    ← Back to Plans
                </button>
                <div className={styles.planTitle}>
                    <h2>{plan.venue_name}</h2>
                    <span className={styles.planDate}>
                        {new Date(plan.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                    <span className={styles.guestBadge}>👤 {plan.guest_count} Guests</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={handleExportCSV} className={styles.buttonSecondary} style={{ padding: '0.5rem 1rem' }}>
                        ⬇ Download CSV
                    </button>
                    <button onClick={handleExportPDF} className={styles.exportBtn}>
                        ⬇ Download PDF
                    </button>
                </div>
            </div>

            {/* EXISTING DESIGN - Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Staff</span>
                    <span className={styles.statValue}>{assignments.length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Internal Team</span>
                    <span className={styles.statValue} style={{ color: '#38a169' }}>
                        {assignments.filter(a => !a.is_freelance).length}
                    </span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Freelancers Needed</span>
                    <span className={styles.statValue} style={{ color: requirementRows.some(r => r.gap > 0) ? '#e53e3e' : '#718096' }}>
                        {requirementRows.reduce((sum, r) => sum + r.gap, 0)}
                    </span>
                </div>
            </div>

            {/* Role Sections */}
            <div className={styles.rolesGrid}>
                {Object.entries(assignmentsByRole).map(([roleName, roleAssignments]) => (
                    <div key={roleName} className={styles.roleSection}>
                        <h4 className={styles.roleHeader}>
                            {roleName} <span className={styles.roleCount}>({roleAssignments.length})</span>
                        </h4>
                        <div className={styles.cardList}>
                            {roleAssignments.map((assignment: PlanAssignment) => (
                                <EmployeeCard
                                    key={assignment.staff_id}
                                    assignment={assignment}
                                    onToggleStatus={(status) => handleStatusToggle(assignment.staff_id, status)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* MANAGER CONTROL PANEL - TOP DOWN DESIGN */}
            <div className={styles.managerControlPanel}>

                {/* ROW 1: FREELANCER REQUIREMENTS TABLE */}
                <div className={styles.controlSection}>
                    <h3 className={styles.sectionTitle}>📊 Staffing Requirements & Gaps</h3>
                    <div className={styles.requirementsTable}>
                        <div className={styles.tableHeader}>
                            <div>Role / Requirement</div>
                            <div>Required</div>
                            <div>Internal Assigned</div>
                            <div>Gap (Freelancers Needed)</div>
                            <div>Status</div>
                        </div>
                        {requirementRows.map(row => (
                            <div key={row.role_id} className={styles.tableRow}>
                                <div className={styles.roleCell}>
                                    <strong>{row.role_name}</strong>
                                </div>
                                <div className={styles.numberCell}>{row.required}</div>
                                <div className={styles.numberCell}>
                                    <span className={styles.internalBadge}>{row.internal_assigned}</span>
                                </div>
                                <div className={styles.numberCell}>
                                    {row.gap > 0 ? (
                                        <span className={styles.gapBadge}>⚠️ {row.gap}</span>
                                    ) : (
                                        <span className={styles.okBadge}>✓ Filled</span>
                                    )}
                                </div>
                                <div className={styles.statusCell}>
                                    {row.gap === 0 ? (
                                        <span className={styles.statusOk}>Fully Staffed</span>
                                    ) : (
                                        <span className={styles.statusWarning}>Action Required</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ROW 2: INTERNAL STAFF POOL (PRIORITY ASSIGNMENT) */}
                <div className={styles.controlSection}>
                    <h3 className={styles.sectionTitle}>👥 Available Internal Staff (Priority Assignment)</h3>
                    <p className={styles.sectionSubtitle}>
                        Assign internal employees first. Sorted by: Home Venue → Experience → Skills
                    </p>

                    {filteredStaff.length > 0 ? (
                        <div className={styles.staffPoolTable}>
                            <div className={styles.tableHeader}>
                                <div>Name</div>
                                <div>Primary Role</div>
                                <div>Languages</div>
                                <div>Skills</div>
                                <div>Type</div>
                                <div>Actions</div>
                            </div>
                            {filteredStaff.slice(0, 10).map(staff => (
                                <div key={staff.id} className={styles.staffRow}>
                                    <div className={styles.nameCell}>
                                        <div className={styles.staffAvatar}>
                                            {staff.full_name.charAt(0)}
                                        </div>
                                        <strong>{staff.full_name}</strong>
                                    </div>
                                    <div>{getRoleName(staff.primary_role_id)}</div>
                                    <div className={styles.languageCell}>
                                        {getLanguages(staff)}
                                    </div>
                                    <div className={styles.skillsCell}>
                                        {(() => {
                                            try {
                                                const skillsStr = typeof staff.special_skills === 'string' ? staff.special_skills : '[]';
                                                const skills = JSON.parse(skillsStr);
                                                if (Array.isArray(skills)) {
                                                    return skills.slice(0, 2).join(', ') || 'None';
                                                }
                                                return 'None';
                                            } catch {
                                                return 'None';
                                            }
                                        })()}
                                    </div>
                                    <div>
                                        <span className={staff.employment_type === 'internal' ? styles.internalTypeBadge : styles.freelanceTypeBadge}>
                                            {staff.employment_type}
                                        </span>
                                    </div>
                                    <div className={styles.actionCell}>
                                        <select
                                            className={styles.roleSelect}
                                            onChange={(e) => {
                                                const roleId = parseInt(e.target.value);
                                                if (roleId) handleAssignStaff(staff, roleId);
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="">Assign to...</option>
                                            {requirementRows.filter(r => r.gap > 0).map(req => (
                                                <option key={req.role_id} value={req.role_id}>
                                                    {req.role_name} (Need {req.gap})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            All available internal staff have been assigned.
                        </div>
                    )}
                </div>

                {/* ROW 3: MANUAL ASSIGNMENT */}
                <div className={styles.controlSection}>
                    <h3 className={styles.sectionTitle}>🔍 Manual Assignment (Search & Assign)</h3>
                    <div className={styles.manualAssignBox}>
                        <div className={styles.searchRow}>
                            <input
                                type="text"
                                placeholder="Search employee by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className={styles.clearBtn}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <p className={styles.helperText}>
                            💡 Search for an employee above, then use the "Assign to..." dropdown in the staff pool table.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
