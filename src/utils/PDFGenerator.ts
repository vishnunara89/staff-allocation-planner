import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Plan, PlanAssignment, StaffMember } from '@/types';

interface PDFData {
    plan: Plan;
    assignments: PlanAssignment[];
    allStaff: StaffMember[];
}

interface RequirementRow {
    role_name: string;
    required: number;
    internal_assigned: number;
    gap: number;
}

export function generateStaffingPlanPDF(data: PDFData) {
    const { plan, assignments, allStaff } = data;
    const doc = new jsPDF('p', 'mm', 'a4');

    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Calculate requirements
    const requirementRows: RequirementRow[] = plan.requirements.map(req => {
        const roleAssignments = assignments.filter(a => a.role_id === req.role_id);
        const internalAssigned = roleAssignments.filter(a => !a.is_freelance).length;
        return {
            role_name: req.role_name,
            required: req.count,
            internal_assigned: internalAssigned,
            gap: Math.max(0, req.count - internalAssigned)
        };
    });

    const totalGap = requirementRows.reduce((sum, r) => sum + r.gap, 0);

    // ========== HEADER SECTION ==========
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('STAFFING PLAN', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Event Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Event:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Event #${plan.event_id}`, margin + 25, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Venue:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(plan.venue_name, margin + 25, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(plan.status.charAt(0).toUpperCase() + plan.status.slice(1), margin + 25, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const eventDate = new Date(plan.event_date);
    doc.text(eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), margin + 25, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Expected Guests:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${plan.guest_count} pax`, margin + 40, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Generated:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), margin + 40, yPos);
    yPos += 12;

    // ========== STAFFING REQUIREMENTS SUMMARY TABLE ==========
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Staffing Requirements Summary', margin, yPos);
    yPos += 8;

    autoTable(doc, {
        startY: yPos,
        head: [['Role', 'Required', 'Internal', 'Freelancers Needed', 'Status']],
        body: requirementRows.map(row => [
            row.role_name,
            row.required.toString(),
            row.internal_assigned.toString(),
            row.gap.toString(),
            row.gap === 0 ? '✓ Fully Staffed' : '⚠ Action Required'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [124, 76, 44], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 50 },
            1: { halign: 'center', cellWidth: 25 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 35 },
            4: { cellWidth: 40 }
        },
        margin: { left: margin, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // ========== INTERNAL STAFF ASSIGNED ==========
    const internalStaff = assignments.filter(a => !a.is_freelance);

    if (internalStaff.length > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Internal Staff Assigned', margin, yPos);
        yPos += 8;

        // Get full staff details
        const staffDetails = internalStaff.map(assignment => {
            const staff = allStaff.find(s => s.id === assignment.staff_id);
            return {
                name: assignment.staff_name,
                role: assignment.role_name,
                skills: staff ? getSkillsString(staff) : 'N/A',
                languages: staff ? getLanguagesString(staff) : 'N/A',
                contact: staff?.notes || 'N/A'
            };
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Name', 'Role', 'Skills', 'Languages', 'Contact']],
            body: staffDetails.map(s => [s.name, s.role, s.skills, s.languages, s.contact]),
            theme: 'striped',
            headStyles: { fillColor: [124, 76, 44], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 35 },
                2: { cellWidth: 40 },
                3: { cellWidth: 35 },
                4: { cellWidth: 30 }
            },
            margin: { left: margin, right: margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // ========== FREELANCERS NEEDED ==========
    if (totalGap > 0) {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Freelancers Needed', margin, yPos);
        yPos += 8;

        const freelancerNeeds = requirementRows.filter(r => r.gap > 0);

        autoTable(doc, {
            startY: yPos,
            head: [['Role', 'Quantity Needed', 'Notes']],
            body: freelancerNeeds.map(row => [
                row.role_name,
                row.gap.toString(),
                'Required to fulfill staffing requirements'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [197, 48, 48], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 60 },
                1: { halign: 'center', cellWidth: 40 },
                2: { cellWidth: 80 }
            },
            margin: { left: margin, right: margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // ========== FOOTER ON ALL PAGES ==========
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Footer line
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Staff Allocation Planner', margin, pageHeight - 10);
        doc.text(`Generated: ${now.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generate filename
    const dateStr = eventDate.toISOString().split('T')[0];
    const venueName = plan.venue_name.replace(/[^a-zA-Z0-9]/g, '_');
    const eventName = `Event_${plan.event_id}`;
    const filename = `EventPlan_${venueName}_${eventName}_${dateStr}.pdf`;

    // Save the PDF
    doc.save(filename);
}

// Helper functions
function getSkillsString(staff: StaffMember): string {
    try {
        const skillsStr = typeof staff.special_skills === 'string' ? staff.special_skills : '[]';
        const skills = JSON.parse(skillsStr);
        if (Array.isArray(skills) && skills.length > 0) {
            return skills.slice(0, 3).join(', ');
        }
    } catch { }
    return 'General';
}

function getLanguagesString(staff: StaffMember): string {
    const langs: string[] = [staff.english_proficiency];
    try {
        const otherLangsStr = typeof staff.other_languages === 'string' ? staff.other_languages : '{}';
        const otherLangs = JSON.parse(otherLangsStr);
        if (typeof otherLangs === 'object' && otherLangs !== null) {
            Object.keys(otherLangs).forEach(lang => {
                if (lang && lang !== 'english') langs.push(lang);
            });
        }
    } catch { }
    return langs.slice(0, 3).join(', ');
}
