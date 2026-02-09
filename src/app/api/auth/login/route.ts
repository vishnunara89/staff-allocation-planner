import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

type DbUser = {
  id: number;
  role: "admin" | "manager";
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // ✅ Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    // ✅ Fetch user
    const user = db
      .prepare(
        "SELECT id, role FROM users WHERE username = ? AND password = ?"
      )
      .get(username, password) as DbUser | undefined;

    // ❌ Invalid credentials
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ Create response
    const response = NextResponse.json({
      success: true,
      role: user.role,
    });

    // ✅ SET COOKIE (CORRECT SYNTAX)
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
