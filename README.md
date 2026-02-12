# 📚 NARA PULSE — Staff Allocation System

> **Version:** 2.0.27  
> **Last Updated:** February 12, 2026  
> **Status:** Production-Ready (Active Development)

---

## 📑 Table of Contents

1. [Project Overview](#-1-project-overview)
2. [System Architecture](#-2-system-architecture)
3. [Getting Started](#-3-getting-started)
4. [Database Documentation](#-4-database-documentation)
5. [API Documentation](#-5-api-documentation)
6. [Frontend Documentation](#-6-frontend-documentation)
7. [Page-by-Page Documentation](#-7-page-by-page-documentation)
8. [Component Documentation](#-8-component-documentation)
9. [Business Logic — Plan Generation Engine](#-9-business-logic--plan-generation-engine)
10. [Status & State Management](#-10-status--state-management)
11. [Authentication & Permissions](#-11-authentication--permissions)
12. [Error Handling](#-12-error-handling)
13. [Data Formats & Conventions](#-13-data-formats--conventions)
14. [CSV / XLSX Import Format](#-14-csv--xlsx-import-format)
15. [Testing Guide](#-15-testing-guide)
16. [Deployment](#-16-deployment)
17. [Troubleshooting](#-17-troubleshooting)
18. [Maintenance](#-18-maintenance)
19. [Future Enhancements](#-19-future-enhancements)
20. [Changelog](#-20-changelog)
21. [Team & Contacts](#-21-team--contacts)
22. [License & Credits](#-22-license--credits)

---

## 🎯 1. Project Overview

### Purpose

**NARA Pulse** is an intelligent staff allocation and planning system built for **Nara Desert Escapes** — a hospitality group operating multiple venues (desert camps, private venues). The system automates the complex process of matching staff to events based on roles, skills, languages, availability, and venue-specific manning requirements.

### Key Features

| Feature | Description |
|---|---|
| 🏢 **Multi-Venue Management** | Manage SONARA, NEST, LADY NARA, and custom venues |
| 👥 **Employee Management** | Full CRUD with roles, skills, languages, availability tracking |
| 📅 **Event Management** | Create events with guest counts, times, priority levels |
| 🧠 **Intelligent Plan Generation** | Score-based engine that matches staff to events automatically |
| 📊 **Manning Tables & Brackets** | Guest-count-based staffing brackets per venue/department |
| 👔 **Manager Portal** | Scoped access — managers see only their assigned venues |
| 📥 **Bulk CSV/XLSX Import** | Import employees from CSV or Excel files |
| 🔐 **Role-Based Access Control** | Admin vs Manager permissions enforced at API + middleware level |
| 📋 **Activity Logging** | Audit trail for staffing changes (Phase 5 — Coming Soon) |
| 🔄 **Plan Regeneration** | Re-run plan generation with version tracking and reason logging |

### Target Users

| Role | Description | Access |
|---|---|---|
| **Admin** | Operations leadership with full system control | All pages, all data, all CRUD |
| **Manager** | Venue managers with scoped responsibilities | Assigned venues only, limited write access |

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 15.x |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 19.x |
| **Database** | SQLite via `better-sqlite3` | 11.x |
| **Auth** | bcryptjs (password hashing) + httpOnly cookies | 2.x |
| **Icons** | Lucide React | Latest |
| **Styling** | CSS Modules | — |
| **File Import** | xlsx (SheetJS) | Latest |
| **Runtime** | Node.js | 18+ |

---

## 🏗️ 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────┐  │
│  │ Admin Panel  │ │Manager Panel│ │  Login Page    │  │
│  │ /admin/*     │ │ /dashboard  │ │  /login        │  │
│  │              │ │ /events     │ │                │  │
│  │ - Dashboard  │ │ /plans      │ └───────────────┘  │
│  │ - Employees  │ │ /staff      │                    │
│  │ - Events     │ │ /venues     │                    │
│  │ - Plans      │ └─────────────┘                    │
│  │ - Venues     │                                    │
│  │ - Managers   │                                    │
│  │ - Rules      │                                    │
│  │ - Activity   │                                    │
│  └─────────────┘                                     │
├─────────────────────────────────────────────────────┤
│               MIDDLEWARE (middleware.ts)              │
│  Route protection · Cookie auth · Role enforcement   │
├─────────────────────────────────────────────────────┤
│                 API LAYER (27 Routes)                │
│  /api/auth/* · /api/staff/* · /api/events/*          │
│  /api/venues/* · /api/plans/* · /api/managers/*       │
│  /api/roles · /api/skills · /api/rules/*             │
│  /api/manning-* · /api/requirements · /api/tasks     │
│  /api/freelancers · /api/activity · /api/dashboard   │
├─────────────────────────────────────────────────────┤
│             BUSINESS LOGIC (lib/)                    │
│  plan-engine.ts · engine.ts · availability-utils.ts  │
│  staff-utils.ts · manningTemplates.ts · auth-utils   │
├─────────────────────────────────────────────────────┤
│              DATABASE (SQLite + WAL)                 │
│           staff-planner.db (16+ tables)              │
└─────────────────────────────────────────────────────┘
```

### Directory Structure

```
staff-allocation-planner/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Root → redirects to /login
│   │   ├── login/page.tsx             # Login page
│   │   ├── admin/
│   │   │   ├── layout.tsx             # Admin layout with sidebar
│   │   │   ├── page.tsx               # Admin dashboard
│   │   │   ├── employees/page.tsx     # Employee management
│   │   │   ├── events/page.tsx        # Event management
│   │   │   ├── plans/page.tsx         # Plan viewing/generation
│   │   │   ├── venues/page.tsx & [id]/page.tsx
│   │   │   ├── managers/page.tsx      # Manager management
│   │   │   ├── rules/page.tsx         # Global staffing rules
│   │   │   └── activity/page.tsx      # Activity log (Phase 5)
│   │   ├── (manager)/
│   │   │   ├── layout.tsx             # Manager layout with sidebar
│   │   │   ├── dashboard/page.tsx     # Manager dashboard
│   │   │   ├── events/page.tsx        # Scoped event view
│   │   │   ├── plans/page.tsx         # Plan generation (scoped)
│   │   │   ├── staff/page.tsx & [id]/edit/page.tsx
│   │   │   └── venues/page.tsx & [id]/page.tsx
│   │   └── api/                       # 27 API route handlers
│   ├── components/                    # 19 UI components
│   ├── lib/                           # Core business logic
│   │   ├── db.ts                      # Database init + migrations
│   │   ├── plan-engine.ts             # Score-based plan generation
│   │   ├── engine.ts                  # Ratio-based staffing calculation
│   │   ├── auth-utils.ts              # Auth helpers
│   │   ├── availability-utils.ts      # Availability logic
│   │   ├── staff-utils.ts             # CSV export/import
│   │   ├── manningTemplates.ts        # Venue templates
│   │   └── ensure*.ts                 # 13 schema migration files
│   ├── types/index.ts                 # TypeScript interfaces
│   ├── middleware.ts                   # Route protection
│   └── scripts/init-db.js            # DB initialization script
├── package.json
└── staff-planner.db                   # SQLite database
```

---

## 🚀 3. Getting Started

### Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | 18.x | `node -v` |
| **npm** | 9.x | `npm -v` |
| **Git** | 2.x | `git --version` |

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd staff-allocation-planner

# 2. Install dependencies
npm install

# 3. Initialize the database (optional — auto-created on first run)
node src/scripts/init-db.js

# 4. Start the development server
npm run dev
```

The application will be available at **http://localhost:3000**.

### Default Credentials

| Role | Username | Password | Redirect |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | `/admin` |
| **Manager** | `manager` | `manager123` | `/dashboard` |

> ⚠️ **IMPORTANT:** Change these default credentials before deploying to production!

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `./staff-planner.db` | Path to SQLite database file |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |

### Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start

# Lint check
npm run lint
```


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

---

## 🚫 12. Error Handling

### API Errors
All API routes return consistent JSON error structures:

| Status Code | Meaning | Context |
|---|---|---|
| **400 Bad Request** | Missing required fields | e.g. "Username and password are required" |
| **401 Unauthorized** | Not logged in | e.g. "Session expired", "Invalid credentials" |
| **403 Forbidden** | Insufficient permissions | e.g. "Admin access required" |
| **404 Not Found** | Resource missing | e.g. "Employee not found", "Venue not found" |
| **409 Conflict** | Data integrity issue | e.g. "Venue name already exists" |
| **500 Internal Error** | Server-side crash | e.g. "Database constraint failed" |

### Client-Side Handling
- **Toast Notifications:** Inline error messages (red text) for form submissions.
- **Console Logging:** Detailed error logs in browser console for debugging.
- **Graceful Fallbacks:** Empty states displayed when lists are empty (e.g. "No employees found").

---

## 💾 13. Data Formats & Conventions

### Date & Time
- **Dates:** ISO 8601 string `YYYY-MM-DD` (e.g., `2026-02-15`)
- **Times:** 24-hour format `HH:MM` (e.g., `14:30`)
- **Timestamps:** ISO string `YYYY-MM-DDTHH:mm:ss.sssZ`

### JSON Types
- **Booleans:** Stored as `0` (false) / `1` (true) in SQLite but returned as booleans in API where possible.
- **Arrays:** Stored as stringified JSON `["item1", "item2"]` in SQLite text columns.
- **Objects:** Stored as stringified JSON `{"key": "value"}` in SQLite text columns.

### Phone Numbers
- **Format:** Free text, but typically cleaned to `+971...` or local format.
- **Storage:** Stored in `phone` column if available, or extracted from `notes` via regex `/(?:phone|mobile|cell|contact):\s*([+\d\s-]+)/i`.

---

## 📥 14. CSV / XLSX Import Format

To import employees via the **Admin Employees Page**, upload a file with the following headers:

| Header | Required | Format/Notes |
|---|---|---|
| **Full Name** | ✅ Yes | String |
| **Role** | ✅ Yes | Must match exactly (case-insensitive) an existing Role name |
| **Mobile Number** | ❌ No | String |
| **Employment Type** | ❌ No | `Internal`, `External` (defaults to Internal) |
| **Status** | ❌ No | `Available`, `In-Event`, `Unavailable` (defaults to Available) |
| **Venue** | ❌ No | Must match existing Venue name (defaults to 'Unknown') |
| **Specific Skills** | ❌ No | Comma or pipe separated (e.g. "Mixology, Wine Knowledge") |
| **Languages** | ❌ No | Comma separated (e.g. "Arabic, French") |
| **Notes** | ❌ No | Free text |

> **Note:** The import process is **smart** — it attempts to fuzzy-match roles and venues. If a role is not found, it defaults to the first available role in the system.

---

## 🧪 15. Testing Guide

### Manual Testing Checklist

| Feature | Action | Expected Result | Status |
|---|---|---|---|
| **Login** | Enter admin/admin123 | Redirect to /admin | ✅ PASS |
| **Auth** | Access /admin without login | Redirect to /login | ✅ PASS |
| **Staff** | Create new employee | Employee appears in list | ✅ PASS |
| **Staff** | Delete employee | Disappears from list | ✅ PASS |
| **Events** | Create event at SONARA | Event appears in list/timeline | ✅ PASS |
| **Plans** | Generate plan for event | Plan created with assignments | ✅ PASS |
| **Plans** | View details | Assignments match requirements | ✅ PASS |
| **Venues** | Add new venue | Appears in dropdowns | ✅ PASS |
| **Import** | Upload staff.csv | Staff added to database | ✅ PASS |

### Automated Tests
The system includes a **Test Engine API** (`/api/test-engine`) that runs unit tests on the planning logic.

- **Run Tests:** `GET http://localhost:3000/api/test-engine`
- **Scope:** 
  - Bracket matching logic
  - Ratio calculations
  - Availability constraints
  - Shortage detection

---

## ⚠️ 16. Dummy Data Audit

| Table | Status | Description | Action Required |
|---|---|---|---|
| `venues` | ⚠️ | Contains `SONARA`, `NEST`, `LADY NARA` | Keep (Project standard) |
| `roles` | ⚠️ | Contains 17 standard roles | Keep (Project standard) |
| `users` | ⚠️ | Contains `admin`, `manager` | **CHANGE PASSWORDS** on prod |
| `requirements_catalog` | ⚠️ | Contains default skills/langs | Review & Expand |
| `manning_templates` | ⚠️ | **Hardcoded** in `manningTemplates.ts` | **MIGRATE to DB** (Phase 4) |
| `employees` | ✅ | Empty by default (User data) | None |
| `events` | ✅ | Empty by default (User data) | None |
| `generated_plans` | ✅ | Empty by default (User data) | None |

---

## 🔄 17. Refresh & Sync Verification

| Page | Verification Status | Auto-Refresh? | Notes |
|---|---|---|---|
| **/admin/dashboard** | ✅ WORKING | No | Stats load on mount. Manual refresh needed. |
| **/admin/employees** | ✅ WORKING | **Partial** | List refreshes after Add/Delete actions. |
| **/admin/events** | ✅ WORKING | **Partial** | List refreshes after Add/Delete actions. |
| **/admin/plans** | ✅ WORKING | **Partial** | List refreshes after Delete. New plans need refresh. |
| **/manager/plans** | ⚠️ NEEDS CHECK | No | Local generation state is client-side only until saved. |
| **/admin/venues** | ✅ WORKING | **Partial** | List refreshes after Add/Delete. |

> **Recommendation:** Implement `SWR` or `React Query` or Next.js `revalidatePath` actions for true real-time synchronization in Phase 4.

---

## 🚀 18. Deployment

1. **Environment Setup:** Ensure Node.js 18+ is installed.
2. **Database:** The `staff-planner.db` file will be created automatically. **BACK THIS UP REGULARLY**.
3. **Build:** Run `npm run build`.
4. **Start:** Run `npm start`.
5. **Process Manager:** Use `pm2` or similar to keep the process alive:
   ```bash
   pm2 start npm --name "nara-pulse" -- start
   ```

---

## 🔧 19. Troubleshooting

### Common Issues

**Issue:** `FOREIGN KEY constraint failed`
- **Cause:** Trying to delete a record (e.g. Role, Venue) that is referenced by other tables.
- **Fix:** The system now checks dependencies before deletion. Manually remove dependent records first if encountered in DB directly.

**Issue:** Plan generation returns "No staff available"
- **Cause:** All staff are `unavailable`, `off`, `in-event`, or max 12h limit reached.
- **Fix:** Check `availability_status` and `hours_worked` in `employees` table.

**Issue:** Hardcoded venues appearing
- **Cause:** `manningTemplates.ts` logic relies on specific venue names.
- **Fix:** Ensure venue names match EXACTLY (case-sensitive) with hardcoded strings if relying on default templates.

---

## 🔮 20. Future Enhancements

- [ ] **Phase 4: Optimization**
  - Migrate hardcoded manning templates to `venue_manning_tables` (DB).
  - Implement SWR for real-time data sync.
  - Add drag-and-drop support for plan adjustments.
- [ ] **Phase 5: Analytics**
  - Build out `/admin/activity` with charts.
  - Add cost estimation to plans.
- [ ] **Phase 6: Notifications**
  - Email/SMS alerts for staff assignments.

---

## 📜 21. License & Credits

**Copyright © 2026 Nara Desert Escapes.**  
All rights reserved. Proprietary software for internal use only.

---


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


---

## 🚫 12. Error Handling

### API Errors
All API routes return consistent JSON error structures:

| Status Code | Meaning | Context |
|---|---|---|
| **400 Bad Request** | Missing required fields | e.g. "Username and password are required" |
| **401 Unauthorized** | Not logged in | e.g. "Session expired", "Invalid credentials" |
| **403 Forbidden** | Insufficient permissions | e.g. "Admin access required" |
| **404 Not Found** | Resource missing | e.g. "Employee not found", "Venue not found" |
| **409 Conflict** | Data integrity issue | e.g. "Venue name already exists" |
| **500 Internal Error** | Server-side crash | e.g. "Database constraint failed" |

### Client-Side Handling
- **Toast Notifications:** Inline error messages (red text) for form submissions.
- **Console Logging:** Detailed error logs in browser console for debugging.
- **Graceful Fallbacks:** Empty states displayed when lists are empty (e.g. "No employees found").

---

## 💾 13. Data Formats & Conventions

### Date & Time
- **Dates:** ISO 8601 string `YYYY-MM-DD` (e.g., `2026-02-15`)
- **Times:** 24-hour format `HH:MM` (e.g., `14:30`)
- **Timestamps:** ISO string `YYYY-MM-DDTHH:mm:ss.sssZ`

### JSON Types
- **Booleans:** Stored as `0` (false) / `1` (true) in SQLite but returned as booleans in API where possible.
- **Arrays:** Stored as stringified JSON `["item1", "item2"]` in SQLite text columns.
- **Objects:** Stored as stringified JSON `{"key": "value"}` in SQLite text columns.

### Phone Numbers
- **Format:** Free text, but typically cleaned to `+971...` or local format.
- **Storage:** Stored in `phone` column if available, or extracted from `notes` via regex `/(?:phone|mobile|cell|contact):\s*([+\d\s-]+)/i`.

---

## 📥 14. CSV / XLSX Import Format

To import employees via the **Admin Employees Page**, upload a file with the following headers:

| Header | Required | Format/Notes |
|---|---|---|
| **Full Name** | ✅ Yes | String |
| **Role** | ✅ Yes | Must match exactly (case-insensitive) an existing Role name |
| **Mobile Number** | ❌ No | String |
| **Employment Type** | ❌ No | `Internal`, `External` (defaults to Internal) |
| **Status** | ❌ No | `Available`, `In-Event`, `Unavailable` (defaults to Available) |
| **Venue** | ❌ No | Must match existing Venue name (defaults to 'Unknown') |
| **Specific Skills** | ❌ No | Comma or pipe separated (e.g. "Mixology, Wine Knowledge") |
| **Languages** | ❌ No | Comma separated (e.g. "Arabic, French") |
| **Notes** | ❌ No | Free text |

> **Note:** The import process is **smart** — it attempts to fuzzy-match roles and venues. If a role is not found, it defaults to the first available role in the system.

---

## 🧪 15. Testing Guide

### Manual Testing Checklist

| Feature | Action | Expected Result | Status |
|---|---|---|---|
| **Login** | Enter admin/admin123 | Redirect to /admin | ✅ PASS |
| **Auth** | Access /admin without login | Redirect to /login | ✅ PASS |
| **Staff** | Create new employee | Employee appears in list | ✅ PASS |
| **Staff** | Delete employee | Disappears from list | ✅ PASS |
| **Events** | Create event at SONARA | Event appears in list/timeline | ✅ PASS |
| **Plans** | Generate plan for event | Plan created with assignments | ✅ PASS |
| **Plans** | View details | Assignments match requirements | ✅ PASS |
| **Venues** | Add new venue | Appears in dropdowns | ✅ PASS |
| **Import** | Upload staff.csv | Staff added to database | ✅ PASS |

### Automated Tests
The system includes a **Test Engine API** (`/api/test-engine`) that runs unit tests on the planning logic.

- **Run Tests:** `GET http://localhost:3000/api/test-engine`
- **Scope:** 
  - Bracket matching logic
  - Ratio calculations
  - Availability constraints
  - Shortage detection

---

## ⚠️ 16. Dummy Data Audit

| Table | Status | Description | Action Required |
|---|---|---|---|
| `venues` | ⚠️ | Contains `SONARA`, `NEST`, `LADY NARA` | Keep (Project standard) |
| `roles` | ⚠️ | Contains 17 standard roles | Keep (Project standard) |
| `users` | ⚠️ | Contains `admin`, `manager` | **CHANGE PASSWORDS** on prod |
| `requirements_catalog` | ⚠️ | Contains default skills/langs | Review & Expand |
| `manning_templates` | ⚠️ | **Hardcoded** in `manningTemplates.ts` | **MIGRATE to DB** (Phase 4) |
| `employees` | ✅ | Empty by default (User data) | None |
| `events` | ✅ | Empty by default (User data) | None |
| `generated_plans` | ✅ | Empty by default (User data) | None |

---

## 🔄 17. Refresh & Sync Verification

| Page | Verification Status | Auto-Refresh? | Notes |
|---|---|---|---|
| **/admin/dashboard** | ✅ WORKING | No | Stats load on mount. Manual refresh needed. |
| **/admin/employees** | ✅ WORKING | **Partial** | List refreshes after Add/Delete actions. |
| **/admin/events** | ✅ WORKING | **Partial** | List refreshes after Add/Delete actions. |
| **/admin/plans** | ✅ WORKING | **Partial** | List refreshes after Delete. New plans need refresh. |
| **/manager/plans** | ⚠️ NEEDS CHECK | No | Local generation state is client-side only until saved. |
| **/admin/venues** | ✅ WORKING | **Partial** | List refreshes after Add/Delete. |

> **Recommendation:** Implement `SWR` or `React Query` or Next.js `revalidatePath` actions for true real-time synchronization in Phase 4.

---

## 🚀 18. Deployment

1. **Environment Setup:** Ensure Node.js 18+ is installed.
2. **Database:** The `staff-planner.db` file will be created automatically. **BACK THIS UP REGULARLY**.
3. **Build:** Run `npm run build`.
4. **Start:** Run `npm start`.
5. **Process Manager:** Use `pm2` or similar to keep the process alive:
   ```bash
   pm2 start npm --name "nara-pulse" -- start
   ```

---

## 🔧 19. Troubleshooting

### Common Issues

**Issue:** `FOREIGN KEY constraint failed`
- **Cause:** Trying to delete a record (e.g. Role, Venue) that is referenced by other tables.
- **Fix:** The system now checks dependencies before deletion. Manually remove dependent records first if encountered in DB directly.

**Issue:** Plan generation returns "No staff available"
- **Cause:** All staff are `unavailable`, `off`, `in-event`, or max 12h limit reached.
- **Fix:** Check `availability_status` and `hours_worked` in `employees` table.

**Issue:** Hardcoded venues appearing
- **Cause:** `manningTemplates.ts` logic relies on specific venue names.
- **Fix:** Ensure venue names match EXACTLY (case-sensitive) with hardcoded strings if relying on default templates.

---

## 🔮 20. Future Enhancements

- [ ] **Phase 4: Optimization**
  - Migrate hardcoded manning templates to `venue_manning_tables` (DB).
  - Implement SWR for real-time data sync.
  - Add drag-and-drop support for plan adjustments.
- [ ] **Phase 5: Analytics**
  - Build out `/admin/activity` with charts.
  - Add cost estimation to plans.
- [ ] **Phase 6: Notifications**
  - Email/SMS alerts for staff assignments.

---

## 📜 21. License & Credits

**Copyright © 2026 Nara Desert Escapes.**  
All rights reserved. Proprietary software for internal use only.

---
# ⚡ DEVELOPER QUICK REFERENCE

> **Purpose:** Cheat sheet for common commands, API routes, and troubleshooting.

---

## 🛠️ CLI Commands

### Setup & Run
| Action | Command |
|---|---|
| **Install** | `npm install` |
| **Init DB** | `node src/scripts/init-db.js` |
| **Start Dev** | `npm run dev` |
| **Build** | `npm run build` |
| **Start Prod** | `npm start` |
| **Lint** | `npm run lint` |

### Database
| Action | Command |
|---|---|
| **View DB** | Use SQLite browser on `staff-planner.db` |
| **Reset DB** | Delete `staff-planner.db` → Run init script |
| **Run Tests** | `curl http://localhost:3000/api/test-engine` |

---

## 📡 Key API Routes

### Auth
- `POST /api/auth/login` - Login (`username`, `password`)
- `POST /api/auth/logout` - Logout

### Plan Generation
- `POST /api/plans/generate` - Generate Plan
  - **Body:** `{ eventId: number }` (Score-based engine)
  - **Body:** `{ date: string, venueId: number }` (Legacy ratio-based)

### Data Management
- `GET /api/staff` - List all staff
- `GET /api/events` - List events (scoped)
- `GET /api/venues` - List venues (scoped)
- `POST /api/plans/save` - Save generated plan

---

## 📂 Key Files & Paths

### Configuration
- `src/lib/db.ts` - Database initialization & schema
- `src/middleware.ts` - Auth & Role protection logic
- `src/lib/manningTemplates.ts` - **Hardcoded** venue templates (Review here if plan generation behaves oddly for specific venues)

### Core Logic
- `src/lib/plan-engine.ts` - **Main scoring engine** for staff allocation
- `src/lib/engine.ts` - Legacy ratio-based engine
- `src/lib/availability-utils.ts` - 12-hour availability rule logic

---

## ⚠️ Troubleshooting "Gotchas"

| Issue | Quick Fix |
|---|---|
| **Login Loop** | Clear browser cookies or checking `httpOnly` cookie settings |
| **"No Staff"** | Check `employees` table for `availability_status` = 'unavailable' |
| **DB Locked** | Restart dev server (SQLite write lock) |
| **Hardcoded Venues** | `SONARA`, `NEST` logic is in `manningTemplates.ts` |
| **Role Deletion** | Fails if linked to rules/plans. Delete dependent data first. |

---

## 🧪 Testing Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Manager** | `manager` | `manager123` |

# 🧪 TESTING CHECKLIST

> **Status:** Critical Check before Deployment.

---

## 🛠️ Feature Verification

### 1. Authentication
- [ ] **Login (Admin)**: `admin` / `admin123` works → Redirects to `/admin`
- [ ] **Login (Manager)**: `manager` / `manager123` works → Redirects to `/dashboard`
- [ ] **Logout**: Clears session, redirects to `/login`
- [ ] **Protection**: Direct access to `/admin` without login fails (redirects)

### 2. Employee Management
- [ ] **Create**: Add new employee "Test User" → Appears in list
- [ ] **Edit**: Change "Test User" role to "Captain" → Helper text updates
- [ ] **Delete**: Delete "Test User" → Disappears from list
- [ ] **Import**: Upload `staff.csv` → DB populates (check console for success)

### 3. Event Management
- [ ] **Create**: Add event "Birthday Bash" @ SONARA → Appears in list
- [ ] **Conflict Check**: Cannot double-book same venue/time (if applicable)
- [ ] **Delete**: Delete "Birthday Bash" → Disappears

### 4. Plan Generation
- [ ] **Generate**: Create "Birthday Bash" plan → Assignments created
- [ ] **View**: Open generated plan → Shows staff names and roles
- [ ] **Regenerate**: Click "Regenerate" → Version increments (v2)
- [ ] **Manning**: Verify staff count matches guest count rules

### 5. Venue Management (Admin Only)
- [ ] **Create**: Add "Desert X" venue → Appears in dropdowns
- [ ] **Delete**: Delete "Desert X" → Disappears (blocked if events exist)
- [ ] **Manager View**: Manager CANNOT see "Desert X" if not assigned

### 6. Manager Scoping
- [ ] **Login as Manager**: Only see assigned venues (e.g., SONARA/NEST)
- [ ] **Events**: Cannot see events for unassigned venues
- [ ] **Plans**: Cannot see plans for unassigned venues

---

## 🔄 Refresh & Sync Verification

| Page | Action | Outcome | Verified? |
|---|---|---|---|
| **Employees** | Add new staff | Auto-updates list | [ ] |
| **Events** | Add new event | Auto-updates list | [ ] |
| **Plans** | Generate plan | New plan appears | [ ] |
| **Venues** | Add venue | Dropdown updates | [ ] |
| **Dashboard** | Add event/staff | Stats update (Refresh needed?) | [ ] |

---

## ⚠️ Data Integrity Checks

- [ ] **No Orphans**: Deleted venue removes its staffing rules?
- [ ] **No Orphans**: Deleted employee removes assignments?
- [ ] **No Orphans**: Deleted event removes plans?

---

## 🚀 Final Launch Steps

1. [ ] **Change Passwords**: Default `admin` / `manager` passwords MUST be changed.
2. [ ] **Backup DB**: Save copy of `staff-planner.db`.
3. [ ] **Build Check**: Run `npm run build` locally to catch errors.
4. [ ] **Lint Check**: Run `npm run lint`.
