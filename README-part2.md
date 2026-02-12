

---

## 🗄️ 4. Database Documentation

### Overview

| Property | Value |
|---|---|
| **Engine** | SQLite 3 via `better-sqlite3` |
| **File** | `staff-planner.db` (project root) |
| **Mode** | WAL (Write-Ahead Logging) |
| **Foreign Keys** | Enabled (`PRAGMA foreign_keys = ON`) |
| **Initialization** | Auto-created on first API call via `src/lib/db.ts` |
| **Migration Strategy** | `addColumnIfMissing()` + 13 `ensure*.ts` files |

### Entity Relationship Diagram

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  venues   │────<│staffing_rules│>────│   roles   │
│           │     └──────────────┘     │           │
│           │──<──┌───────────┐        │           │
│           │     │  events   │        └─────┬─────┘
│           │     └─────┬─────┘              │
│           │     ┌─────┴──────────┐   ┌─────┴──────┐
│           │     │generated_plans │   │ employees   │
│           │     └─────┬──────────┘   └─────┬───────┘
│           │     ┌─────┴──────────────┐     │
│           │     │employee_assignments│>────┘
│           │     └────────────────────┘
│           │──<──┌───────────────┐
│           │     │manning_brackets│
│           │     └───────────────┘
│           │──<──┌────────────────────┐
│           │     │venue_manning_tables │
│           │     └────────────────────┘
│           │──<──┌───────────────┐     ┌───────┐
│           │     │manager_venues │>────│ users │
└──────────┘     └───────────────┘     └───────┘
```

### Table Schemas

#### `venues`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Unique venue ID |
| `name` | TEXT | NOT NULL, UNIQUE | Venue name |
| `type` | TEXT | DEFAULT 'camp' | `camp` / `private` / `other` |
| `default_service_style` | TEXT | DEFAULT 'sharing' | Service style |
| `notes` | TEXT | — | Additional notes |

**Seed Data:** SONARA (camp), NEST (camp), LADY NARA (private)

#### `roles`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Unique role ID |
| `name` | TEXT | NOT NULL, UNIQUE | Role name |

**Seed Data (17 roles):** Captain, Waiter/Waitress, Host/Hostess, Barista, Bartender, Chef de Rang, Commis, Demi Chef Partie, Chef de Partie, Sous Chef, Head Chef, Sommelier, Runner, Steward, Supervisor, Manager, General Manager

#### `users`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | User ID |
| `name` | TEXT | DEFAULT '' | Display name |
| `phone` | TEXT | DEFAULT '' | Phone |
| `username` | TEXT | NOT NULL, UNIQUE | Login username |
| `password` | TEXT | NOT NULL | bcrypt hash |
| `role` | TEXT | CHECK(`admin` or `manager`) | System role |

**Seed Data:** admin/admin123, manager/manager123

#### `employees`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Employee ID |
| `full_name` | TEXT | NOT NULL | Full name |
| `primary_role_id` | INTEGER | NOT NULL, FK→roles | Primary role |
| `secondary_roles` | TEXT | DEFAULT '[]' | JSON array of role IDs |
| `english_proficiency` | TEXT | DEFAULT 'basic' | `basic`/`conversational`/`fluent`/`native` |
| `other_languages` | TEXT | DEFAULT '{}' | JSON `{lang: proficiency}` |
| `special_skills` | TEXT | DEFAULT '[]' | JSON array of skill names |
| `experience_tags` | TEXT | DEFAULT '[]' | JSON array |
| `home_base_venue_id` | INTEGER | FK→venues | Home venue |
| `employment_type` | TEXT | DEFAULT 'internal' | `internal`/`external` |
| `availability_status` | TEXT | DEFAULT 'available' | `available`/`in-event`/`off`/`unavailable` |
| `notes` | TEXT | DEFAULT '' | Notes |
| `employee_role` | TEXT | DEFAULT 'staff' | `admin`/`manager`/`staff` |
| `phone` | TEXT | DEFAULT '' | Phone number |
| `current_event_id` | INTEGER | — | Current event |
| `working_hours` | REAL | DEFAULT 0 | Hours worked |

#### `events`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | Event ID |
| `event_name` | TEXT | — | Event name |
| `date` | TEXT | NOT NULL | YYYY-MM-DD |
| `venue_id` | INTEGER | NOT NULL, FK→venues | Venue |
| `guest_count` | INTEGER | NOT NULL | Guest count |
| `service_style_override` | TEXT | — | Override default |
| `special_requirements` | TEXT | DEFAULT '' | Requirements |
| `priority` | TEXT | DEFAULT 'normal' | `low`/`normal`/`high`/`critical` |
| `start_time` | TEXT | — | HH:MM |
| `end_time` | TEXT | — | HH:MM |

#### `staffing_rules`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Rule ID |
| `venue_id` | INTEGER | NOT NULL, FK→venues | Venue |
| `department` | TEXT | DEFAULT 'service' | Department |
| `role_id` | INTEGER | NOT NULL, FK→roles | Role |
| `ratio_guests` | INTEGER | DEFAULT 0 | Guests per staff ratio |
| `ratio_staff` | INTEGER | DEFAULT 0 | Staff per ratio group |
| `threshold_guests` | INTEGER | — | Guest threshold |
| `threshold_staff` | INTEGER | — | Staff at threshold |
| `min_required` | INTEGER | DEFAULT 0 | Minimum staff |
| `max_allowed` | INTEGER | — | Max staff cap |
| `notes` | TEXT | — | Notes |

#### `manning_brackets`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Bracket ID |
| `venue_id` | INTEGER | NOT NULL | Venue |
| `department` | TEXT | NOT NULL | Department |
| `guest_min` | INTEGER | NOT NULL | Min guests |
| `guest_max` | INTEGER | NOT NULL | Max guests |
| `counts_json` | TEXT | NOT NULL | JSON `{role_id: count}` |
| `notes` | TEXT | DEFAULT '' | Notes |
| `source` | TEXT | DEFAULT 'manual' | Source |
| `updated_at` | TEXT | — | Timestamp |

#### `generated_plans`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Plan ID |
| `event_id` | INTEGER | NOT NULL, FK→events | Event |
| `generated_by` | INTEGER | FK→users | Who generated |
| `status` | TEXT | DEFAULT 'draft' | `draft`/`active`/`archived` |
| `version` | INTEGER | DEFAULT 1 | Version number |
| `plan_data` | TEXT | — | Full plan JSON |
| `regeneration_reason` | TEXT | — | Reason |
| `generated_at` | DATETIME | DEFAULT NOW | Timestamp |

#### `employee_assignments`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Assignment ID |
| `employee_id` | INTEGER | NOT NULL | Employee |
| `event_id` | INTEGER | NOT NULL | Event |
| `plan_id` | INTEGER | — | Plan reference |
| `date` | TEXT | — | Date |
| `start_time` | TEXT | — | Shift start |
| `end_time` | TEXT | — | Shift end |
| `hours_worked` | REAL | DEFAULT 0 | Hours |
| `status` | TEXT | DEFAULT 'assigned' | Status |
| `is_freelance` | INTEGER | DEFAULT 0 | 0=internal, 1=freelance |
| `role_id` | INTEGER | — | Assigned role |

#### `freelancers`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Freelancer ID |
| `name` | TEXT | NOT NULL | Name |
| `phone` | TEXT | NOT NULL | Phone |
| `role` | TEXT | — | Position |
| `skills` | TEXT | — | Skills |
| `notes` | TEXT | — | Notes |
| `created_at` | DATETIME | DEFAULT NOW | Created |

#### `manager_venues`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | ID |
| `manager_id` | INTEGER | NOT NULL | FK→users |
| `venue_id` | INTEGER | — | FK→venues |
| `venue_name` | TEXT | — | Denormalized name |

#### `plan_activity_log`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Log ID |
| `plan_id` | INTEGER | — | Plan |
| `event_id` | INTEGER | — | Event |
| `action` | TEXT | NOT NULL | `plan_saved`, `regenerated` |
| `reason` | TEXT | — | Reason |
| `performed_by` | INTEGER | — | User ID |
| `changes` | TEXT | — | Change description |
| `performed_at` | DATETIME | DEFAULT NOW | Timestamp |

#### `activity_log`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Log ID |
| `user_id` | INTEGER | — | Acting user |
| `user_name` | TEXT | — | User name |
| `venue_id` | INTEGER | — | Venue |
| `venue_name` | TEXT | — | Venue name |
| `action_type` | TEXT | — | e.g., `STAFFING_UPDATE` |
| `description` | TEXT | — | Description |
| `created_at` | DATETIME | DEFAULT NOW | Timestamp |

#### `staffing_plans` (Legacy)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Plan ID |
| `event_date` | TEXT | NOT NULL | Date |
| `venue_id` | INTEGER | NOT NULL | Venue |
| `staff_id` | INTEGER | — | Employee |
| `assigned_role_id` | INTEGER | — | Role |
| `status` | TEXT | DEFAULT 'pending' | Status |
| `reasoning` | TEXT | — | Reasoning |

> ⚠️ Legacy table — the primary plan system uses `generated_plans` + `employee_assignments`.

#### `requirements_catalog`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | ID |
| `type` | TEXT | NOT NULL | `skill` or `language` |
| `value` | TEXT | NOT NULL | Requirement name |

**Seed Data:** Arabic, French, Russian (languages); Wine Knowledge, Mixology, Fine Dining (skills)

#### `skills`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK | Skill ID |
| `name` | TEXT | NOT NULL, UNIQUE | Skill name |

### Database Initialization Flow

```
App Start → db.ts loads → SQLite connection (WAL, FK ON)
  → Core tables created → 13 ensure*.ts run (idempotent)
  → addColumnIfMissing() migrations → Seed data inserted
  → ✅ Database ready
```

---

## 📡 5. API Documentation

### Overview

All API routes are under `/src/app/api/`. All return JSON responses. Authentication is via `user` httpOnly cookie.

### Authentication APIs

#### `POST /api/auth/login`

Authenticates a user and sets an httpOnly session cookie.

| Field | Description |
|---|---|
| **Request Body** | `{ username: string, password: string }` |
| **Success (200)** | `{ success: true, role: "admin" \| "manager" }` |
| **Error (400)** | `{ error: "Username and password required" }` |
| **Error (401)** | `{ error: "Invalid credentials" }` |
| **Cookie Set** | `user` = `{ id, role }` (httpOnly, sameSite: lax) |

#### `POST /api/auth/logout`

Clears the session cookie.

| Field | Description |
|---|---|
| **Request Body** | None |
| **Success (200)** | `{ success: true }` |
| **Cookie** | `user` cookie expired |

### Dashboard API

#### `GET /api/dashboard`

Returns aggregated statistics. Scoped by role: admins see all, managers see assigned venues only.

| Field | Description |
|---|---|
| **Auth** | Required (admin or manager) |
| **Response** | `{ venues, staff, availableStaff, upcomingEvents, activePlans, staffAvailability: { available, unavailable }, employmentTypes: { internal, external }, venueTypes: { camp, private, other } }` |

### Staff/Employee APIs

#### `GET /api/staff`

Returns all employees. Both admin and manager roles see the **full global staff list** (centralized view). Includes dynamic status cleanup — employees whose `in-event` assignments have ended are automatically reverted to `available`.

| Field | Description |
|---|---|
| **Auth** | Admin or Manager |
| **Response** | Array of employee objects with joined `primary_role_name` and `home_venue_name` |
| **JSON Fields Parsed** | `secondary_roles`, `other_languages`, `special_skills`, `experience_tags` |

#### `POST /api/staff`

Creates a new employee. **Admin only.**

| Field | Description |
|---|---|
| **Auth** | Admin only |
| **Required** | `full_name`, `primary_role_id` |
| **Optional** | All other employee fields |
| **Success (201)** | `{ id: <new_id> }` |

#### `GET /api/staff/[id]`

Returns a single employee by ID.

#### `PUT /api/staff/[id]`

Updates an employee by ID. All fields updatable.

#### `DELETE /api/staff/[id]`

Deletes an employee. Uses a transaction to clean up related `staffing_plans` references first.

#### `POST /api/staff/import`

Bulk imports employees from CSV or XLSX files. **Admin only.** Accepts `multipart/form-data` with a `file` field.

| Detail | Description |
|---|---|
| **Formats** | `.csv`, `.xlsx`, `.xls` |
| **Matching** | Role names matched case-insensitively; unmatched roles default to first available |
| **Skills** | Parsed from pipe (`\|`) or comma-separated values |
| **Languages** | Parsed as `Language:Proficiency` pairs |
| **Phone** | Automatically merged into `notes` field as `Phone:<number>` |
| **Response** | `{ success, imported: count, warnings: [], errors: [] }` |

### Event APIs

#### `GET /api/events`

Lists events. Managers see only events at their assigned venues. Supports query params: `date`, `from_date`, `venue_id`.

#### `POST /api/events`

Creates an event. Required: `date`, `venue_id`, `guest_count`.

#### `PUT /api/events/[id]`

Updates an event by ID.

#### `DELETE /api/events/[id]`

Deletes an event by ID.

### Venue APIs

#### `GET /api/venues`

Lists venues. Managers see only assigned venues.

#### `POST /api/venues`

Creates a venue. **Admin only.** Handles UNIQUE constraint errors (409).

#### `GET /api/venues/[id]`

Returns a single venue.

#### `PUT /api/venues/[id]`

Updates a venue. **Admin only.**

#### `DELETE /api/venues/[id]`

Deletes a venue. **Admin only.** Checks for event dependencies (blocks deletion if events exist). Cascade-deletes staffing rules. Unlinks staff home base.

### Manager APIs

#### `GET /api/managers`

Lists all managers with their assigned venue IDs and names. **Admin only.**

#### `POST /api/managers`

Creates a new manager user (auto-hashed password). **Admin only.** Required: `name`, `phone`, `username`, `password`.

#### `PUT /api/managers`

Assigns venues to a manager. Uses a transaction: clears old assignments, inserts new ones with venue names. **Admin only.**

| Field | Description |
|---|---|
| **Body** | `{ managerId: number, venueIds: number[] }` |
| **Response** | `{ success: true, assignedCount: N }` |

#### `DELETE /api/managers`

Deletes a manager and their venue assignments. **Admin only.**

### Role APIs

#### `GET /api/roles`

Lists all roles. No auth required for read (used in dropdowns).

#### `POST /api/roles`

Creates a role. Requires `canManageDefinitions()` (admin or manager).

#### `DELETE /api/roles?id=N`

Deletes a role with cascading cleanup. Uses a transaction to:
1. Delete related `staffing_rules`
2. Nullify `staffing_plans` references
3. Fallback employees to another role (or delete if no fallback exists)
4. Handle system user roles if applicable
5. Delete the role

### Skill APIs

#### `GET /api/skills`

Lists all skills from the `skills` table.

#### `POST /api/skills`

Creates a skill. Requires `canManageDefinitions()`.

#### `DELETE /api/skills?id=N`

Deletes a skill and cleans up employee `special_skills` JSON arrays in a transaction.

### Plan APIs

#### `GET /api/plans`

Lists all generated plans with event details, staff counts, freelancer counts, and generated-by user name. Managers see only plans for their venues.

#### `POST /api/plans`

Saves a plan with assignments. Uses a transaction to:
1. Delete existing plan for the event
2. Insert new `generated_plans` record
3. Insert `employee_assignments` records
4. Update employee statuses to `in-event`
5. Sync to legacy `staffing_plans` table

#### `POST /api/plans/generate`

Generates a staffing plan. Supports two modes:

| Mode | Trigger | Engine Used |
|---|---|---|
| **Event-centric** | `event_id` provided | `plan-engine.ts` (score-based) |
| **Date-based** | `date` provided (no event_id) | `engine.ts` (ratio-based, legacy) |

Returns: `{ requirements, assignments, shortages, total_staff_needed, internal_assigned, freelancers_needed, logs }`.

#### `POST /api/plans/save`

Saves/updates a generated plan. Creates employee assignments with calculated hours. Logs activity. Syncs to legacy table.

#### `GET /api/plans/[id]`

Returns full plan details including parsed `plan_data`, activity log, and event info.

#### `PUT /api/plans/[id]`

Updates plan data, status, and/or assignments. Logs activity.

#### `DELETE /api/plans/[id]`

Deletes a plan and its assignments and activity log.

#### `POST /api/plans/[id]/regenerate`

Regenerates a plan with a new version. Accepts `{ reason }`. Increments version, updates plan data, recreates assignments, logs activity.

### Staffing Rule APIs

#### `GET /api/rules?venue_id=N`

Lists rules, optionally filtered by venue.

#### `POST /api/rules`

Creates a staffing rule. Required: `venue_id`, `role_id`.

#### `PUT /api/rules/[id]`

Updates a rule by ID.

#### `DELETE /api/rules/[id]`

Deletes a rule by ID.

### Manning Table APIs

#### `GET /api/manning-tables?venue_id=N`

Returns manning table configurations for a venue.

#### `POST /api/manning-tables`

Upserts a manning table config (uses `ON CONFLICT` for venue_id + department). Logs activity.

### Manning Bracket APIs

#### `GET /api/manning-brackets?venue_id=N&department=D`

Returns brackets for a venue/department combination.

#### `POST /api/manning-brackets`

Batch saves brackets. Deletes existing brackets for the venue/department and inserts new ones in a transaction.

### Requirements API

#### `GET /api/requirements`

Returns merged requirements from `requirements_catalog` + staff skills/languages. Calculates `available_internal` count for each requirement.

#### `POST /api/requirements`

Adds a new skill or language to the catalog.

### Other APIs

#### `GET /api/freelancers` / `POST` / `DELETE?id=N`

CRUD for freelancer contacts.

#### `GET /api/tasks` / `POST`

Task management. Admin sees all; managers see only assigned tasks.

#### `GET /api/activity?venue_id=N`

Returns activity logs (last 50 entries), optionally filtered by venue.

#### `GET /api/test-engine`

Automated test suite for the staffing engine. Tests bracket matching, ratio calculations, allocation priorities, availability respect, and shortage calculations.
