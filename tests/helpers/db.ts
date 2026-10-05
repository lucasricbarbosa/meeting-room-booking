import { prisma } from "@/server/db";

// Children before parents, so Restrict foreign keys never block a delete.
export async function resetDatabase(): Promise<void> {
  await prisma.reservation.deleteMany();
  await prisma.roomFeature.deleteMany();
  await prisma.room.deleteMany();
  await prisma.feature.deleteMany();
  await prisma.user.deleteMany();
}
