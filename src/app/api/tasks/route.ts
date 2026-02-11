import { NextResponse } from "next/server";
import db from "@/lib/db";
import { isAdmin, getUserRole, getUserId } from "@/lib/auth-utils";

/* =========================
   GET – TASKS
========================= */
export async function GET() {
  try {
    const role = getUserRole();
    const userId = getUserId();

    if (!role || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ ADMIN → ALL TASKS
    if (role === "admin") {
      const tasks = db.prepare(`
        SELECT t.*, u.name AS manager_name
        FROM tasks t
        LEFT JOIN manager_tasks mt ON mt.task_id = t.id
        LEFT JOIN users u ON u.id = mt.manager_id
        ORDER BY t.created_at DESC
      `).all();

      return NextResponse.json(tasks);
    }

    // ✅ MANAGER → ONLY ASSIGNED TASKS
    if (role === "manager") {
      const tasks = db.prepare(`
        SELECT t.*
        FROM tasks t
        JOIN manager_tasks mt ON mt.task_id = t.id
        WHERE mt.manager_id = ?
        ORDER BY t.created_at DESC
      `).all(userId);

      return NextResponse.json(tasks);
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (err) {
    console.error("GET tasks error:", err);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

/* =========================
   POST – CREATE TASK (ADMIN)
========================= */
export async function POST(req: Request) {
  try {
    if (!isAdmin()) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description)
      VALUES (?, ?)
    `).run(title, description || null);

    return NextResponse.json(
      { id: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST task error:", err);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
