import { cookies } from "next/headers";

export function getUserRole(): "admin" | "manager" | null {
    const userCookie = cookies().get("user");
    if (!userCookie) return null;
    try {
        const user = JSON.parse(userCookie.value);
        return user.role;
    } catch {
        return null;
    }
}

export function isAdmin(): boolean {
    return getUserRole() === "admin";
}

export function isManager(): boolean {
    const role = getUserRole();
    return role === "manager" || role === "admin"; // Managers can do manager things, Admins can do everything
}

export function canManageDefinitions(): boolean {
    const role = getUserRole();
    return role === "admin" || role === "manager";
}

export function getUserId(): number | null {
    const userCookie = cookies().get("user");
    if (!userCookie) return null;
    try {
        const user = JSON.parse(userCookie.value);
        return user.id;
    } catch {
        return null;
    }
}
