import "server-only";
import { prisma } from "@/server/db";

// Reads a real table instead of SELECT 1: SQLite creates an empty file for a wrong path,
// so SELECT 1 would pass even without the migrated schema.
export async function pingDatabase(): Promise<void> {
  await prisma.room.findFirst({ select: { id: true } });
}
