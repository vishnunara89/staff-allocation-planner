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
