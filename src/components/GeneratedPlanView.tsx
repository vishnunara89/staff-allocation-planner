import React, { useState, useRef, useEffect } from 'react';
import { Plan, PlanAssignment, StaffMember, Role, EmployeeAvailability, Freelancer } from '@/types';
import styles from '../app/(manager)/plans/plans.module.css';
import EmployeeCard from './EmployeeCard';
import FreelancerInput from './FreelancerInput';
import RegenerationModal from './RegenerationModal';
import { generateStaffingPlanPDF } from '@/utils/PDFGenerator';
import { exportPlanToCSV } from '@/lib/staff-utils';

interface GeneratedPlanViewProps {
    plan: Plan;
    onBack: () => void;
    onExport: () => void;
    eventName?: string;
    eventPriority?: string;
    eventStartTime?: string;
    eventEndTime?: string;
    planId?: number;
    onRefresh?: () => void;
}

interface RequirementRow {
    role_id: number;
    role_name: string;
    required: number;
    internal_assigned: number;
    gap: number;
}

export default function GeneratedPlanView({
    plan, onBack, onExport, eventName, eventPriority,
    eventStartTime, eventEndTime, planId, onRefresh
}: GeneratedPlanViewProps) {
    const planRef = useRef<HTMLDivElement>(null);
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [assignments, setAssignments] = useState<PlanAssignment[]>(
        plan.requirements.flatMap(r => r.assignments)
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showRegenModal, setShowRegenModal] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [freelancerRole, setFreelancerRole] = useState<{ name: string; id: number } | null>(null);
    const [staffPhones, setStaffPhones] = useState<Record<number, string>>({});

    useEffect(() => {
        Promise.all([
            fetch('/api/staff').then(res => res.json()),
            fetch('/api/roles').then(res => res.json())
        ]).then(([staffData, rolesData]) => {
            setAllStaff(Array.isArray(staffData) ? staffData : []);
            setRoles(Array.isArray(rolesData) ? rolesData : []);

            // Build phone lookup from staff data
            const phones: Record<number, string> = {};
            (Array.isArray(staffData) ? staffData : []).forEach((s: StaffMember) => {
                if (s.phone) phones[s.id] = s.phone;
                else if (s.notes) {
                    const match = s.notes.match(/Phone:\s*([+\d\s-]+)/i);
                    if (match) phones[s.id] = match[1].trim();
                }
            });
            setStaffPhones(phones);
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
        const aIsHome = a.home_base_venue_id !== null;
        const bIsHome = b.home_base_venue_id !== null;
        if (aIsHome && !bIsHome) return -1;
        if (bIsHome && !aIsHome) return 1;
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
        setSaved(false);
    };

    const handleRemoveAssignment = (staffId: number) => {
        setAssignments(assignments.filter(a => a.staff_id !== staffId));
        setSaved(false);
    };

    const handleStatusToggle = (staffId: number, newStatus: 'confirmed' | 'pending' | 'declined') => {
        setAssignments(prev => prev.map(a =>
            a.staff_id === staffId ? { ...a, status: newStatus } : a
        ));
        setSaved(false);
    };

    const handleExportCSV = () => {
        try { exportPlanToCSV(plan, assignments); }
        catch (error) { console.error('CSV Export failed:', error); alert('Failed to export CSV.'); }
    };

    const handleExportPDF = () => {
        try { generateStaffingPlanPDF({ plan, assignments, allStaff }); }
        catch (error) { console.error('PDF Export failed:', error); alert('Failed to export PDF.'); }
    };

    // Save plan to database
    const handleSave = async () => {
        setSaving(true);
        try {
            const planData = {
                requirements: plan.requirements,
                total_staff: assignments.length,
                total_freelancers: assignments.filter(a => a.is_freelance).length,
                venue_name: plan.venue_name,
                event_date: plan.event_date,
                guest_count: plan.guest_count
            };

            const res = await fetch('/api/plans/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: plan.event_id,
                    plan_data: planData,
                    assignments: assignments
                })
            });

            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Failed to save plan: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save plan.');
        } finally {
            setSaving(false);
        }
    };

    // Regenerate plan
    const handleRegenerate = async (reason: string) => {
        setShowRegenModal(false);
        setRegenerating(true);
        try {
            if (planId) {
                // Regenerate existing saved plan
                const res = await fetch(`/api/plans/${planId}/regenerate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason })
                });
                const data = await res.json();
                if (data.success && data.plan) {
                    const newAssignments = data.plan.requirements.flatMap((r: any) => r.assignments);
                    setAssignments(newAssignments);
                    setSaved(false);
                }
            } else {
                // Regenerate from scratch
                const res = await fetch('/api/plans/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event_id: plan.event_id })
                });
                const data = await res.json();
                if (data.requirements) {
                    const newAssignments = data.requirements.flatMap((r: any) => r.assignments);
                    setAssignments(newAssignments);
                    setSaved(false);
                }
            }
        } catch (err) {
            console.error('Regeneration error:', err);
            alert('Failed to regenerate plan.');
        } finally {
            setRegenerating(false);
        }
    };

    // Add freelancer to plan
    const handleAddFreelancer = (freelancer: Freelancer & { role_id: number }) => {
        const newAssignment: PlanAssignment = {
            staff_id: -(Date.now()),
            staff_name: `${freelancer.name} (FL)`,
            role_id: freelancer.role_id,
            role_name: freelancerRole?.name || freelancer.role || 'Staff',
            status: 'pending',
            is_freelance: true
        };
        setAssignments([...assignments, newAssignment]);
        setFreelancerRole(null);
        setSaved(false);
    };

    // Group assignments by role for display
    const assignmentsByRole: Record<string, PlanAssignment[]> = assignments.reduce(
        (acc: Record<string, PlanAssignment[]>, curr: PlanAssignment) => {
            if (!acc[curr.role_name]) acc[curr.role_name] = [];
            acc[curr.role_name].push(curr);
            return acc;
        }, {}
    );

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

    const totalGap = requirementRows.reduce((sum, r) => sum + r.gap, 0);

    // Priority badge config
    const priorityBadges: Record<string, { bg: string; color: string; label: string }> = {
        normal: { bg: '#f1f5f9', color: '#475569', label: 'Normal' },
        vip: { bg: '#FFF3E0', color: '#E65100', label: '⭐ VIP' },
        vvip: { bg: '#FFF8E1', color: '#FF6F00', label: '👑 VVIP' }
    };

    return (
        <div className={styles.generatedView} ref={planRef}>
            {/* Header */}
            <div className={styles.viewHeader}>
                <button onClick={onBack} className={styles.backBtn}>
                    ← Back to Plans
                </button>
                <div className={styles.planTitle}>
                    <h2>{eventName || plan.venue_name}</h2>
                    <span className={styles.planDate}>
                        {plan.venue_name} • {new Date(plan.event_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        {eventStartTime && ` • ${eventStartTime}${eventEndTime ? ` – ${eventEndTime}` : ''}`}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.4rem' }}>
                        <span className={styles.guestBadge}>👤 {plan.guest_count} Guests</span>
                        {eventPriority && eventPriority !== 'normal' && (
                            <span style={{
                                display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px',
                                fontSize: '0.8rem', fontWeight: 600,
                                background: priorityBadges[eventPriority]?.bg || '#f1f5f9',
                                color: priorityBadges[eventPriority]?.color || '#475569'
                            }}>
                                {priorityBadges[eventPriority]?.label || eventPriority}
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={() => setShowRegenModal(true)} disabled={regenerating}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '10px', border: '1.5px solid #E65100',
                            background: 'white', color: '#E65100', fontWeight: 600, fontSize: '0.85rem',
                            cursor: regenerating ? 'not-allowed' : 'pointer', opacity: regenerating ? 0.6 : 1,
                            transition: 'all 0.2s'
                        }}>
                        {regenerating ? '🔄 Regenerating...' : '🔄 Regenerate'}
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
                            background: saved ? '#15803d' : '#7C4C2C', color: 'white',
                            fontWeight: 600, fontSize: '0.85rem',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(124, 76, 44, 0.2)'
                        }}>
                        {saving ? '💾 Saving...' : saved ? '✓ Saved!' : '💾 Save Plan'}
                    </button>
                    <button onClick={handleExportCSV} style={{
                        padding: '0.5rem 1rem', borderRadius: '10px',
                        border: '1px solid #e2e8f0', background: 'white', color: '#475569',
                        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                    }}>⬇ CSV</button>
                    <button onClick={handleExportPDF} className={styles.exportBtn}>
                        ⬇ PDF
                    </button>
                </div>
            </div>

            {/* Stats Row */}
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
                    <span className={styles.statValue} style={{ color: totalGap > 0 ? '#e53e3e' : '#718096' }}>
                        {totalGap}
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
                                    phone={staffPhones[assignment.staff_id]}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* MANAGER CONTROL PANEL */}
            <div className={styles.managerControlPanel}>

                {/* ROW 1: STAFFING REQUIREMENTS TABLE */}
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
                                        <button
                                            onClick={() => setFreelancerRole({ name: row.role_name, id: row.role_id })}
                                            style={{
                                                background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2',
                                                padding: '0.3rem 0.6rem', borderRadius: '8px', fontWeight: 600,
                                                fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            + Add Freelancer
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ROW 2: INTERNAL STAFF POOL */}
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
                            💡 Search for an employee above, then use the &quot;Assign to...&quot; dropdown in the staff pool table.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showRegenModal && (
                <RegenerationModal
                    onConfirm={handleRegenerate}
                    onClose={() => setShowRegenModal(false)}
                />
            )}

            {freelancerRole && (
                <FreelancerInput
                    roleName={freelancerRole.name}
                    roleId={freelancerRole.id}
                    onAdd={handleAddFreelancer}
                    onClose={() => setFreelancerRole(null)}
                />
            )}
        </div>
    );
}
