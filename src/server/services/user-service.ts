import "server-only";
import type { UserSummary } from "@/domain/user";
import { prisma } from "@/server/db";

const userSummarySelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export function listUsers(): Promise<UserSummary[]> {
  return prisma.user.findMany({
    select: userSummarySelect,
    orderBy: { name: "asc" },
  });
}

export function getUserById(id: string): Promise<UserSummary | null> {
  return prisma.user.findUnique({
    where: { id },
    select: userSummarySelect,
  });
}
