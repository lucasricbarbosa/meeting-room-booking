import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import type { UserSummary } from "@/domain/user";
import { getUserById } from "@/server/services/user-service";

const SESSION_COOKIE = "session_user_id";

// cache() dedupes the lookup when the layout and the page both ask for the user in the same request.
export const getCurrentUser = cache(async (): Promise<UserSummary | null> => {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return getUserById(userId);
});

export async function requireUser(): Promise<UserSummary> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdmin(): Promise<UserSummary> {
  const user = await requireUser();
  // 404 instead of 403 so the admin area does not reveal that it exists.
  if (user.role !== "ADMIN") notFound();
  return user;
}

export async function setSessionCookie(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
