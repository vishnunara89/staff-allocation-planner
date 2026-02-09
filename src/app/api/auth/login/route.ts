import { NextResponse } from "next/server";
import db from "@/lib/db";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/* =====================
   DB USER TYPE
===================== */
type DbUser = {
  id: number;
  username: string;
  password: string;
  role: "admin" | "manager";
};

/* =====================
   POST – LOGIN
===================== */
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    /* =====================
       VALIDATION
    ===================== */
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    /* =====================
       FETCH USER
    ===================== */
    const user = db
      .prepare(
        `
        SELECT id, username, password, role
        FROM users
        WHERE username = ?
        `
      )
      .get(username) as DbUser | undefined;

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    /* =====================
       PASSWORD CHECK
    ===================== */
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    /* =====================
       CREATE RESPONSE
    ===================== */
    const response = NextResponse.json({
      success: true,
      role: user.role, // admin | manager
    });

    /* =====================
       SET AUTH COOKIE
    ===================== */
    response.cookies.set(
      "user",
      JSON.stringify({
        id: user.id,
        role: user.role,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
