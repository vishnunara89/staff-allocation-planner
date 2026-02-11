import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin, canManageDefinitions } from "@/lib/auth-utils";
import type { Role } from "@/types";

/* =========================
   GET – List All Roles
========================= */
export async function GET() {
  try {
    const roles = db
      .prepare("SELECT id, name FROM roles ORDER BY name ASC")
      .all() as Role[];

    // ✅ Return array directly (important for dropdowns)
    return NextResponse.json(roles);

  } catch (error) {
    console.error("Database error (roles GET):", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}


/* =========================
   POST – Create Role (Admin Only)
========================= */
export async function POST(req: Request) {
  try {
    // 🔐 Admin & Manager check
    if (!canManageDefinitions()) {
      return NextResponse.json(
        { error: "Unauthorized: Admin or Manager access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const roleName = body?.name?.trim();

    if (!roleName) {
      return NextResponse.json(
        { error: "Role name required" },
        { status: 400 }
      );
    }

    // Insert role
    db.prepare("INSERT INTO roles (name) VALUES (?)").run(roleName);

    return NextResponse.json(
      { success: true, message: "Role created successfully" },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("Database error (roles POST):", err);

    if (err.message?.includes("UNIQUE")) {
      return NextResponse.json(
        { error: "Role already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE – Remove Role (Admin Only)
========================= */
export async function DELETE(req: Request) {
  try {
    if (!canManageDefinitions()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Role ID required" }, { status: 400 });
    }

    // Get the name of the role being deleted
    const roleToDelete = db.prepare("SELECT name FROM roles WHERE id = ?").get(id) as { name: string } | undefined;
    if (!roleToDelete) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Use a transaction for safety
    const deleteTransaction = db.transaction(() => {
      // 1. Delete staffing rules referencing this role
      db.prepare("DELETE FROM staffing_rules WHERE role_id = ?").run(id);

      // 2. Cleanup staffing plans assignments
      db.prepare("UPDATE staffing_plans SET assigned_role_id = NULL WHERE assigned_role_id = ?").run(id);

      // 3. Handle Fallback for Employees (NOT NULL constraint)
      const fallback = db.prepare("SELECT id, name FROM roles WHERE id != ? LIMIT 1").get(id) as { id: number; name: string } | undefined;

      if (fallback) {
        // Update staff table
        db.prepare("UPDATE staff SET primary_role_id = ? WHERE primary_role_id = ?").run(fallback.id, id);

        // Update employees table (if it exists)
        try {
          db.prepare("UPDATE employees SET primary_role_id = ? WHERE primary_role_id = ?").run(fallback.id, id);
        } catch (e) {
          console.warn("Could not update employees table (might not exist):", (e as Error).message);
        }
      } else {
        // No fallback exists! To satisfy NOT NULL and FOREIGN KEY constraints, 
        // we must delete any remaining staff/employees assigned to this role.
        db.prepare("DELETE FROM staff WHERE primary_role_id = ?").run(id);

        try {
          db.prepare("DELETE FROM employees WHERE primary_role_id = ?").run(id);
        } catch (e) {
          console.warn("Could not cleanup employees table (might not exist):", (e as Error).message);
        }
      }

      // 4. Update users table (System Roles: admin/manager)
      // Since the users table uses a TEXT column with a CHECK constraint (admin/manager),
      // we only update it if the role actually matches one of those strings.
      if (roleToDelete.name === 'admin' || roleToDelete.name === 'manager') {
        const userFallback = (roleToDelete.name === 'admin') ? 'manager' : 'admin';
        db.prepare("UPDATE users SET role = ? WHERE role = ?").run(userFallback, roleToDelete.name);
      }

      // 5. Finally delete the role
      db.prepare("DELETE FROM roles WHERE id = ?").run(id);
    });

    try {
      deleteTransaction();
      return NextResponse.json({ success: true, message: "Role deleted and references updated" });
    } catch (error: any) {
      console.error("Database error (roles DELETE):", error);
      return NextResponse.json({ error: "Could not delete role: " + error.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Global database error (roles DELETE):", error);
    return NextResponse.json({ error: "Failed to delete role: " + (error as Error).message }, { status: 500 });
  }
}
