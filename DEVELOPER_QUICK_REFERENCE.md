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
