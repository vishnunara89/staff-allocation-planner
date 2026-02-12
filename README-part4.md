
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
