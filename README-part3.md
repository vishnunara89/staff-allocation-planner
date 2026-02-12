

---

## 🖼️ 6. Frontend Documentation

### Routing Architecture

The app uses Next.js **App Router** with two layout groups:

| Route Group | Layout | Sidebar | Target Role |
|---|---|---|---|
| `/admin/*` | `src/app/admin/layout.tsx` | `AdminSidebar.tsx` | Admin |
| `/(manager)/*` | `src/app/(manager)/layout.tsx` | `ModernSidebar.tsx` | Manager |
| `/login` | None (standalone) | — | All |
| `/` | — | — | Redirects to `/login` |

### Route Map

| Route | Page Component | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Root redirect → `/login` |
| `/login` | `src/app/login/page.tsx` | Authentication page |
| **Admin Routes** | | |
| `/admin` | `src/app/admin/page.tsx` | Admin dashboard |
| `/admin/employees` | `src/app/admin/employees/page.tsx` | Employee management |
| `/admin/events` | `src/app/admin/events/page.tsx` | Event management |
| `/admin/plans` | `src/app/admin/plans/page.tsx` | Plan viewing/generation |
| `/admin/venues` | `src/app/admin/venues/page.tsx` | Venue list |
| `/admin/venues/[id]` | `src/app/admin/venues/[id]/page.tsx` | Venue detail + rules |
| `/admin/managers` | `src/app/admin/managers/page.tsx` | Manager CRUD |
| `/admin/rules` | `src/app/admin/rules/page.tsx` | Global staffing rules |
| `/admin/activity` | `src/app/admin/activity/page.tsx` | Activity log (Phase 5) |
| **Manager Routes** | | |
| `/dashboard` | `src/app/(manager)/dashboard/page.tsx` | Manager dashboard |
| `/events` | `src/app/(manager)/events/page.tsx` | Scoped events |
| `/plans` | `src/app/(manager)/plans/page.tsx` | Plan generation |
| `/staff` | `src/app/(manager)/staff/page.tsx` | Staff directory |
| `/staff/[id]/edit` | `src/app/(manager)/staff/[id]/edit/page.tsx` | Edit employee |
| `/venues` | `src/app/(manager)/venues/page.tsx` | Assigned venues |
| `/venues/[id]` | `src/app/(manager)/venues/[id]/page.tsx` | Venue detail |

### Styling System

| Pattern | Description |
|---|---|
| **CSS Modules** | All pages use `*.module.css` files for scoped styling |
| **Design Tokens** | CSS variables: `--font-cormorant`, `--font-outfit` |
| **Icons** | Lucide React (consistent icon library) |
| **Layout** | Sidebar + main content area with responsive design |

**CSS Module Files (14 total):**

| File | Used By |
|---|---|
| `login/login.module.css` | Login page |
| `admin/admin-dashboard.module.css` | Admin dashboard |
| `admin/admin-layout.module.css` | Admin layout |
| `admin/employees/employees.module.css` | Employee management |
| `admin/events/events.module.css` | Admin events |
| `admin/managers/managers.module.css` | Manager management |
| `admin/plans/plans.module.css` | Admin plans + Activity |
| `admin/venues/venues.module.css` | Venues + Rules pages |
| `(manager)/dashboard/dashboard.module.css` | Manager dashboard |
| `(manager)/events/events.module.css` | Manager events |
| `(manager)/plans/plans.module.css` | Manager plans |
| `(manager)/staff/staff.module.css` | Staff directory |
| `(manager)/venues/venues.module.css` | Manager venues |
| `(manager)/venues/[id]/venue-detail.module.css` | Venue detail |

---

## 📄 7. Page-by-Page Documentation

### 7.1 Login Page

| Property | Detail |
|---|---|
| **File** | `src/app/login/page.tsx` |
| **CSS** | `src/app/login/login.module.css` |
| **Purpose** | User authentication with role-based redirect |
| **APIs Called** | `POST /api/auth/login` |
| **Components Used** | None (self-contained) |
| **DB Tables** | `users` (via API) |
| **Refresh Behavior** | N/A — stateless form |
| **Dummy Data** | ⚠️ Default credentials: admin/admin123, manager/manager123 |

**User Actions:**
- Enter username and password
- Click "Secure Login" button
- On success: Admin → `/admin`, Manager → `/dashboard`
- On error: Inline error message displayed

**State Variables:** `username`, `password`, `error`, `loading`

---

### 7.2 Admin Dashboard

| Property | Detail |
|---|---|
| **File** | `src/app/admin/page.tsx` |
| **CSS** | `src/app/admin/admin-dashboard.module.css` |
| **Purpose** | Overview of system metrics and quick actions |
| **APIs Called** | `GET /api/dashboard` |
| **Components Used** | None (inline metric cards) |
| **DB Tables** | `venues`, `employees`, `events`, `generated_plans` (aggregated via API) |
| **Refresh Behavior** | Data loads on mount (`useEffect`). Manual page refresh required for updates. |
| **Dummy Data** | ✅ No dummy data (reads live aggregated stats) |

**User Actions:**
- View metric cards (Venues, Staff, Events, Plans)
- Click quick action links (Add Event, View Plans, Manage Staff)

**State Variables:** `loading`, `stats` (object), `error`

---

### 7.3 Admin Employees Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/employees/page.tsx` |
| **CSS** | `src/app/admin/employees/employees.module.css` |
| **Purpose** | Full employee CRUD with search, filters, CSV/XLSX import/export |
| **APIs Called** | `GET /api/staff`, `GET /api/venues`, `GET /api/roles`, `DELETE /api/staff/[id]`, `POST /api/staff`, `PUT /api/staff/[id]`, `POST /api/staff/import` |
| **Components Used** | `AdminEmployeeCard`, `AdminImportModal`, `EmployeeModal` |
| **DB Tables** | `employees`, `venues`, `roles`, `staffing_plans` |
| **Refresh Behavior** | Loads on mount. Re-fetches after create/update/delete/import. |
| **Dummy Data** | ✅ No dummy data (user-created employees) |

**User Actions:**
- Search employees by name
- Filter by venue, role, status
- Add new employee (opens EmployeeModal)
- Edit employee (opens EmployeeModal in edit mode)
- Delete employee (confirmation prompt)
- Import from CSV/XLSX (opens AdminImportModal)
- Export to CSV

**State Variables:** `employees[]`, `venues[]`, `roles[]`, `search`, `showAdd`, `showImport`, `editEmployee`, `loading`

**Key Functions:**
- `fetchData()` — loads employees, venues, roles
- `handleDelete(id)` — delete with confirmation
- `getVenueName(id)` / `getRoleName(id)` / `getEventName(id)` — lookups

---

### 7.4 Admin Events Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/events/page.tsx` |
| **CSS** | `src/app/admin/events/events.module.css` |
| **Purpose** | Event CRUD with search, venue filter, timeline display |
| **APIs Called** | `GET /api/events`, `GET /api/venues`, `POST /api/events`, `PUT /api/events/[id]`, `DELETE /api/events/[id]` |
| **Components Used** | `EventModal`, `EventDetailModal` |
| **DB Tables** | `events`, `venues` |
| **Refresh Behavior** | Loads on mount. Re-fetches after create/edit/delete. |
| **Dummy Data** | ✅ No dummy data |

**User Actions:**
- Search events
- Filter by venue
- Add new event (opens EventModal)
- Click event card → view details (opens EventDetailModal)
- Edit / Delete events

**State Variables:** `events[]`, `venues[]`, `search`, `selectedVenue`, `showModal`, `editEvent`, `selectedEvent`, `loading`

**Key Functions:**
- `fetchData()` — loads events and venues
- `handleSaveEvent(dto)` — create or update
- `handleDeleteEvent(id)` — delete event
- `formatTime(timeStr)` — time display helper

---

### 7.5 Admin Plans Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/plans/page.tsx` |
| **CSS** | `src/app/admin/plans/plans.module.css` |
| **Purpose** | View all generated plans with filtering; view plan details |
| **APIs Called** | `GET /api/plans`, `GET /api/venues`, `GET /api/events`, `GET /api/plans/[id]` |
| **Components Used** | `CustomDropdown`, `GeneratedPlanView` |
| **DB Tables** | `generated_plans`, `employee_assignments`, `events`, `venues`, `users` |
| **Refresh Behavior** | Loads on mount. Manual refresh required for new plans. |
| **Dummy Data** | ✅ No dummy data |

**User Actions:**
- Search plans by event name
- Filter by venue
- View plan details (opens GeneratedPlanView)
- See "Generated By" user name on each plan card

**State Variables:** `plans[]`, `venues[]`, `events[]`, `search`, `selectedVenue`, `selectedPlan`, `loading`

---

### 7.6 Admin Venues Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/venues/page.tsx` |
| **CSS** | `src/app/admin/venues/venues.module.css` |
| **Purpose** | Venue list with CRUD, search, manager/rule counts |
| **APIs Called** | `GET /api/venues`, `GET /api/rules`, `POST /api/venues`, `DELETE /api/venues/[id]` |
| **Components Used** | `VenueModal` |
| **DB Tables** | `venues`, `staffing_rules`, `events` |
| **Refresh Behavior** | Loads on mount. Re-fetches after create/delete. |
| **Dummy Data** | ⚠️ 3 seed venues: SONARA, NEST, LADY NARA |

**User Actions:**
- Search venues by name
- Add venue (opens VenueModal)
- Click venue card → navigate to detail page
- Delete venue (blocked if events exist)

---

### 7.7 Admin Venue Detail Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/venues/[id]/page.tsx` |
| **Purpose** | Venue detail with manning tables, brackets, staffing rules, skills |
| **APIs Called** | `GET /api/venues/[id]`, `GET /api/manning-tables`, `GET /api/manning-brackets`, `GET /api/rules`, `GET /api/roles`, `GET /api/skills`, `POST /api/manning-tables`, `POST /api/manning-brackets`, `POST /api/rules`, `DELETE /api/rules/[id]` |
| **DB Tables** | `venues`, `manning_brackets`, `venue_manning_tables`, `staffing_rules`, `roles`, `skills` |
| **Refresh Behavior** | Loads on mount via venue ID param. Re-fetches after save operations. |
| **Dummy Data** | ⚠️ Manning templates hardcoded in `manningTemplates.ts` |

---

### 7.8 Admin Managers Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/managers/page.tsx` |
| **CSS** | `src/app/admin/managers/managers.module.css` |
| **Purpose** | Manager CRUD with venue assignment |
| **APIs Called** | `GET /api/managers`, `GET /api/venues`, `POST /api/managers`, `PUT /api/managers`, `DELETE /api/managers` |
| **Components Used** | None (inline forms) |
| **DB Tables** | `users`, `manager_venues`, `venues` |
| **Refresh Behavior** | Loads on mount. Re-fetches after create/delete/assign. |
| **Dummy Data** | ⚠️ Default manager user: manager/manager123 |

**User Actions:**
- Search managers
- Add manager (inline form with name, phone, username, password)
- Assign venues to manager (checkbox list)
- Delete manager (with confirmation)

**Key Functions:**
- `loadData()` — fetches managers + venues
- `addManager()` — creates manager user
- `deleteManager(id)` — deletes with cascading venue cleanup
- `saveAssignment()` — assigns venues to selected manager

---

### 7.9 Admin Rules Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/rules/page.tsx` |
| **CSS** | `src/app/admin/venues/venues.module.css` (shared) |
| **Purpose** | Global view of all staffing rules across venues |
| **APIs Called** | `GET /api/rules`, `GET /api/venues`, `GET /api/roles` |
| **Components Used** | `CustomDropdown` |
| **DB Tables** | `staffing_rules`, `venues`, `roles` |
| **Refresh Behavior** | Loads on mount. |
| **Dummy Data** | ✅ No dummy data (rules are user-configured) |

---

### 7.10 Admin Activity Page

| Property | Detail |
|---|---|
| **File** | `src/app/admin/activity/page.tsx` |
| **CSS** | `src/app/admin/plans/plans.module.css` (shared) |
| **Purpose** | **Placeholder** — scheduled for Phase 5 (Advanced Analytics & Audit) |
| **APIs Called** | None |
| **Components Used** | None |
| **DB Tables** | `activity_log` (API exists, UI not connected) |
| **Refresh Behavior** | N/A (static placeholder) |
| **Dummy Data** | N/A |

> ⚠️ **Note:** The `GET /api/activity` endpoint exists and returns real activity data, but this page does not yet consume it. The page displays a "Coming Soon" message.

---

### 7.11 Manager Dashboard

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/dashboard/page.tsx` |
| **CSS** | `src/app/(manager)/dashboard/dashboard.module.css` |
| **Purpose** | Manager-scoped dashboard with metrics and quick actions |
| **APIs Called** | `GET /api/dashboard` |
| **Components Used** | `MetricCard`, `ProgressStat`, `Row`, `ActionCard` (all inline) |
| **DB Tables** | Same as admin dashboard, but scoped to assigned venues |
| **Refresh Behavior** | Loads on mount. Manual refresh for updates. |
| **Dummy Data** | ✅ No dummy data |

**User Actions:**
- View scoped metrics (assigned venues, staff, events)
- Quick action links (Events, Plans, Staff, Venues)
- Logout button

---

### 7.12 Manager Events Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/events/page.tsx` |
| **Purpose** | View/create events scoped to assigned venues |
| **APIs Called** | `GET /api/events`, `GET /api/venues`, `POST /api/events`, `PUT /api/events/[id]`, `DELETE /api/events/[id]` |
| **Components Used** | `EventModal`, `EventDetailModal` |
| **DB Tables** | `events`, `venues`, `manager_venues` |
| **Refresh Behavior** | Loads on mount. Re-fetches after mutations. |
| **Dummy Data** | ✅ No dummy data |

---

### 7.13 Manager Plans Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/plans/page.tsx` |
| **CSS** | `src/app/(manager)/plans/plans.module.css` |
| **Purpose** | Generate and manage staffing plans for assigned venues |
| **APIs Called** | `GET /api/events`, `GET /api/venues`, `GET /api/staff`, `GET /api/roles`, `GET /api/rules`, `GET /api/manning-brackets`, `POST /api/plans/save`, `GET /api/plans` |
| **Components Used** | `NewPlanModal`, `GeneratedPlanView` |
| **DB Tables** | `events`, `venues`, `employees`, `roles`, `staffing_rules`, `manning_brackets`, `generated_plans`, `employee_assignments` |
| **Refresh Behavior** | Loads on mount. Re-fetches after plan save/generation. |
| **Dummy Data** | ✅ No dummy data |

> 📝 **Note:** The manager plans page contains **client-side plan generation logic** (`handleGeneratePlan`) that mirrors the server-side `plan-engine.ts` — this is used for local preview before saving.

---

### 7.14 Manager Staff Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/staff/page.tsx` |
| **CSS** | `src/app/(manager)/staff/staff.module.css` |
| **Purpose** | View all staff with search, filter, and card display |
| **APIs Called** | `GET /api/staff`, `GET /api/venues`, `GET /api/roles` |
| **Components Used** | `EmployeeCard`, `BulkImportModal` |
| **DB Tables** | `employees`, `venues`, `roles` |
| **Refresh Behavior** | Loads on mount. |
| **Dummy Data** | ✅ No dummy data |

---

### 7.15 Manager Staff Edit Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/staff/[id]/edit/page.tsx` |
| **Purpose** | Edit a specific employee's details |
| **APIs Called** | `GET /api/staff/[id]`, `PUT /api/staff/[id]`, `GET /api/venues`, `GET /api/roles`, `GET /api/skills` |
| **DB Tables** | `employees`, `venues`, `roles`, `skills` |
| **Refresh Behavior** | Loads employee data on mount via route param. |
| **Dummy Data** | ✅ No dummy data |

---

### 7.16 Manager Venues Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/venues/page.tsx` |
| **CSS** | `src/app/(manager)/venues/venues.module.css` |
| **Purpose** | View assigned venues (read-only list — no add/delete buttons) |
| **APIs Called** | `GET /api/venues` |
| **DB Tables** | `venues`, `manager_venues` |
| **Refresh Behavior** | Loads on mount. |
| **Dummy Data** | ⚠️ Same seed venues visible |

---

### 7.17 Manager Venue Detail Page

| Property | Detail |
|---|---|
| **File** | `src/app/(manager)/venues/[id]/page.tsx` |
| **CSS** | `src/app/(manager)/venues/[id]/venue-detail.module.css` |
| **Purpose** | View venue details, manning tables, and rules (read-only) |
| **APIs Called** | `GET /api/venues/[id]`, `GET /api/manning-tables`, `GET /api/manning-brackets`, `GET /api/rules`, `GET /api/roles`, `GET /api/skills` |
| **DB Tables** | Same as admin venue detail |
| **Refresh Behavior** | Loads on mount. |
| **Dummy Data** | ⚠️ Same as admin venue detail |

---

## 🧩 8. Component Documentation

### 8.1 AdminEmployeeCard

| Property | Detail |
|---|---|
| **File** | `src/components/AdminEmployeeCard.tsx` |
| **CSS** | `src/components/admin-employee-card.module.css` |
| **Used By** | Admin Employees Page |
| **Purpose** | Displays employee info in a card with actions |

**Props:** `employee` (StaffMember), `venues[]`, `roles[]`, `onEdit(employee)`, `onDelete(id)`, helper functions for name lookups

---

### 8.2 AdminImportModal

| Property | Detail |
|---|---|
| **File** | `src/components/AdminImportModal.tsx` |
| **CSS** | `src/components/AdminImportModal.module.css` |
| **Used By** | Admin Employees Page |
| **Purpose** | Modal for CSV/XLSX file upload and import |
| **APIs Called** | `POST /api/staff/import` |

**Props:** `isOpen`, `onClose`, `onImportComplete`

---

### 8.3 AdminSidebar

| Property | Detail |
|---|---|
| **File** | `src/components/AdminSidebar.tsx` |
| **CSS** | `src/components/admin-sidebar.module.css` |
| **Used By** | Admin Layout (`src/app/admin/layout.tsx`) |
| **Purpose** | Admin navigation sidebar with collapsible design |

**Navigation Items:** Dashboard, Employees, Events, Plans, Venues, Managers, Rules, Activity

---

### 8.4 BulkImportModal

| Property | Detail |
|---|---|
| **File** | `src/components/BulkImportModal.tsx` |
| **Used By** | Manager Staff Page |
| **Purpose** | CSV/XLSX import modal for manager context |

---

### 8.5 CustomDropdown

| Property | Detail |
|---|---|
| **File** | `src/components/CustomDropdown.tsx` |
| **CSS** | `src/components/dropdown.module.css` |
| **Used By** | Admin Plans, Admin Rules, Manager Plans |
| **Purpose** | Styled dropdown/select component |

**Props:** `label`, `options[]`, `value`, `onChange`, `placeholder`

---

### 8.6 EmployeeCard

| Property | Detail |
|---|---|
| **File** | `src/components/EmployeeCard.tsx` |
| **Used By** | Manager Staff Page |
| **Purpose** | Employee display card for manager context |

---

### 8.7 EmployeeModal

| Property | Detail |
|---|---|
| **File** | `src/components/EmployeeModal.tsx` |
| **Used By** | Admin Employees Page |
| **Purpose** | Create/Edit employee form modal |
| **APIs Called** | `POST /api/staff`, `PUT /api/staff/[id]` |

**Props:** `isOpen`, `onClose`, `onSave`, `employee?` (for edit mode), `venues[]`, `roles[]`

**Form Fields:** Full name, primary role, secondary roles, home venue, employment type, availability status, English proficiency, other languages, special skills, experience tags, phone, notes

---

### 8.8 EventDetailModal

| Property | Detail |
|---|---|
| **File** | `src/components/EventDetailModal.tsx` |
| **Used By** | Admin Events, Manager Events |
| **Purpose** | Read-only event detail display |

**Props:** `event`, `venue`, `onClose`

---

### 8.9 EventModal

| Property | Detail |
|---|---|
| **File** | `src/components/EventModal.tsx` |
| **Used By** | Admin Events, Manager Events |
| **Purpose** | Create/Edit event form modal |

**Props:** `isOpen`, `onClose`, `onSave`, `event?`, `venues[]`

**Form Fields:** Event name, date, venue, guest count, priority, start time, end time, special requirements

---

### 8.10 FreelancerInput

| Property | Detail |
|---|---|
| **File** | `src/components/FreelancerInput.tsx` |
| **Used By** | GeneratedPlanView |
| **Purpose** | Input fields for adding freelancer details to a plan |

---

### 8.11 GeneratedPlanView

| Property | Detail |
|---|---|
| **File** | `src/components/GeneratedPlanView.tsx` |
| **Used By** | Admin Plans, Manager Plans |
| **Purpose** | Full plan detail display with assignments, shortages, freelancer needs |
| **APIs Called** | `POST /api/plans/save`, `PUT /api/plans/[id]`, `DELETE /api/plans/[id]`, `POST /api/plans/[id]/regenerate` |

**Features:** Assignment list with role/venue info, shortage warnings, freelancer needs, save/regenerate/delete actions, version tracking

---

### 8.12 ManagerModal

| Property | Detail |
|---|---|
| **File** | `src/components/ManagerModal.tsx` |
| **Used By** | Admin Managers Page (not currently connected — inline form used instead) |
| **Purpose** | Manager creation modal |

---

### 8.13 ModernSidebar

| Property | Detail |
|---|---|
| **File** | `src/components/ModernSidebar.tsx` |
| **CSS** | `src/components/modern-sidebar.module.css` |
| **Used By** | Manager Layout (`src/app/(manager)/layout.tsx`) |
| **Purpose** | Manager navigation sidebar with glassmorphism design |

**Navigation Items:** Dashboard, Events, Plans, Staff, Venues

---

### 8.14 NewPlanModal

| Property | Detail |
|---|---|
| **File** | `src/components/NewPlanModal.tsx` |
| **Used By** | Manager Plans Page |
| **Purpose** | Event selection modal for plan generation |

---

### 8.15 PremiumTimePicker

| Property | Detail |
|---|---|
| **File** | `src/components/PremiumTimePicker.tsx` |
| **CSS** | `src/components/time-picker.module.css` |
| **Used By** | EventModal |
| **Purpose** | Styled time input component with AM/PM support |

---

### 8.16 RegenerationModal

| Property | Detail |
|---|---|
| **File** | `src/components/RegenerationModal.tsx` |
| **Used By** | GeneratedPlanView |
| **Purpose** | Confirm and provide reason for plan regeneration |

**Props:** `isOpen`, `onClose`, `onConfirm(reason)`

---

### 8.17 Sidebar

| Property | Detail |
|---|---|
| **File** | `src/components/Sidebar.tsx` |
| **CSS** | `src/components/sidebar.module.css` |
| **Used By** | Alternate/legacy sidebar component |
| **Purpose** | Generic sidebar navigation |

---

### 8.18 StatusDropdown

| Property | Detail |
|---|---|
| **File** | `src/components/StatusDropdown.tsx` |
| **CSS** | `src/components/status-dropdown.module.css` |
| **Used By** | Employee cards |
| **Purpose** | Styled dropdown for employee availability status |

**Options:** available, in-event, off, unavailable

---

### 8.19 VenueModal

| Property | Detail |
|---|---|
| **File** | `src/components/VenueModal.tsx` |
| **Used By** | Admin Venues Page |
| **Purpose** | Create/Edit venue form modal |

**Props:** `isOpen`, `onClose`, `onSave`, `venue?`

**Form Fields:** Venue name, type (camp/private/other), service style, notes

---

## 🧠 9. Business Logic — Plan Generation Engine

### Two Engines

The system has **two distinct plan generation engines**, used in different contexts:

| Engine | File | Mode | Trigger |
|---|---|---|---|
| **Score-Based** | `src/lib/plan-engine.ts` | Server-side | `POST /api/plans/generate` with `event_id` |
| **Ratio-Based** | `src/lib/engine.ts` | Server-side | `POST /api/plans/generate` with `date` only |

### Engine 1: Score-Based (plan-engine.ts) — Primary

This is the **intelligent** engine used for production plan generation.

**Scoring Algorithm:**

```
For each employee × each requirement:
  Score = Role Match (40pts) + Home Base (20pts) + Skills (20pts) + Language (20pts)
```

| Factor | Points | Logic |
|---|---|---|
| **Role Match** | 40 | Primary role = 40pts, Secondary role = 25pts |
| **Home Base** | 20 | Employee's home venue matches event venue |
| **Skills** | 20 | Matching `special_skills` against `special_requirements` |
| **Language** | 20 | English proficiency level + other language matches |

**Generation Flow:**

```
1. Fetch event details (venue, guest count, times)
2. Fetch manning brackets for venue
3. Match guest count to bracket → get required counts per role
4. Fallback to staffing rules if no bracket matches
5. Get all available employees
6. Check availability (max 12hrs/day rule)
7. Score each employee against each requirement
8. Sort by score descending → assign top scorers
9. Track remaining needs → flag as freelancer requirements
10. Return: { requirements, assignments, shortages, logs }
```

**Availability Check:**

```
src/lib/availability-utils.ts
├── MAX_DAILY_HOURS = 12
├── calculateEmployeeAvailability()
│   ├── Queries employee_assignments for the date
│   ├── Sums hours_worked
│   └── Returns: available | limited | unavailable
└── getEmployeesWithAvailability()
    └── Batch availability check for all employees
```

### Engine 2: Ratio-Based (engine.ts) — Legacy

Used as fallback when no specific event ID is provided.

**Process:**
1. Get staffing rules for venue
2. Get manning brackets for venue
3. Calculate requirement per role = `Math.ceil(guestCount / ratio_guests) * ratio_staff`
4. Apply bracket overrides if guest count falls in range
5. Apply `min_required` / `max_allowed` caps
6. Allocate available staff to requirements
7. Flag shortages

### Manning Templates (Hardcoded)

**File:** `src/lib/manningTemplates.ts`

Contains hardcoded manning configurations for:
- **SONARA** — desert camp with full service
- **NEST** — intimate camp setting  
- **LADY NARA** — private venue
- **RAMADAN** — seasonal/event configuration

> ⚠️ These templates are used as **defaults/fallbacks** for venues without custom brackets. They can be overridden by database-stored manning tables.

---

## 🔄 10. Status & State Management

### Employee Status Lifecycle

```
              ┌──────────────────────────────────────┐
              │                                      │
   ┌──────────▼──────────┐                           │
   │     available       │◄──── Manual update        │
   │  (default status)   │◄──── Auto-cleanup on      │
   └──────────┬──────────┘      event end             │
              │                                       │
              │  Plan saved /                         │
              │  Event assigned                       │
              │                                       │
   ┌──────────▼──────────┐                            │
   │     in-event        │────── Event ends ──────────┘
   │  (actively working) │
   └──────────┬──────────┘
              │
              │  Manual update
              │
   ┌──────────▼──────────┐
   │    off / unavailable │
   │   (manual status)   │
   └─────────────────────┘
```

**Automatic Status Transitions:**

| Transition | Trigger | Code Location |
|---|---|---|
| `available` → `in-event` | Plan saved with employee assignment | `POST /api/plans/save` |
| `in-event` → `available` | Event date has passed + no active assignments | `GET /api/staff` (cleanup logic) |
| Any → manual status | Admin/manager manually updates | `PUT /api/staff/[id]` |

**Status Display Locations:**
- Employee cards (color-coded badges)
- Staff directory list
- Plan assignment view

### Plan Status Lifecycle

```
  draft ──► active ──► archived
```

| Status | Meaning |
|---|---|
| `draft` | Just generated, not yet confirmed |
| `active` | Currently active plan |
| `archived` | Superseded by regeneration |

---

## 🔐 11. Authentication & Permissions

### Authentication Flow

```
Login Page → POST /api/auth/login
  ├── bcrypt.compare(password, hash)
  ├── Set httpOnly cookie: { id, role }
  └── Redirect: admin → /admin, manager → /dashboard

Middleware (middleware.ts)
  ├── Read 'user' cookie
  ├── If missing → redirect to /login
  ├── If /admin/* and role ≠ admin → redirect to /dashboard
  └── Allow request through
```

### Permission Matrix

| Action | Admin | Manager |
|---|---|---|
| View all employees | ✅ | ✅ |
| Create employee | ✅ | ❌ |
| Edit employee | ✅ | ✅ |
| Delete employee | ✅ | ❌ |
| Import employees | ✅ | ✅ |
| View all venues | ✅ | Assigned only |
| Create/Edit/Delete venue | ✅ | ❌ |
| View all events | ✅ | Assigned venues |
| Create/Edit/Delete event | ✅ | ✅ (scoped) |
| Generate plans | ✅ | ✅ (scoped) |
| View all plans | ✅ | Assigned venues |
| Manage managers | ✅ | ❌ |
| Create/Delete roles | ✅ | ✅ |
| Create/Delete skills | ✅ | ✅ |
| View dashboard stats | ✅ All | Scoped |
| Configure manning tables | ✅ | Read-only |

### Auth Utility Functions

**File:** `src/lib/auth-utils.ts`

| Function | Returns | Description |
|---|---|---|
| `getUserRole()` | `string \| null` | Gets role from cookie |
| `isAdmin()` | `boolean` | Checks admin role |
| `isManager()` | `boolean` | Checks manager role |
| `canManageDefinitions()` | `boolean` | Admin OR manager |
| `getUserId()` | `number \| null` | Gets user ID from cookie |

### Middleware Configuration

**File:** `src/middleware.ts`

**Protected Routes:** All except `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`

**Admin-Only Routes:** `/admin`, `/admin/*`
