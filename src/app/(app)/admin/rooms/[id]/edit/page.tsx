import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateRoomAction } from "@/app/actions/rooms";
import { RoomForm } from "@/components/admin/room-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { roomIdSchema } from "@/schemas/room";
import { requireAdmin } from "@/server/auth";
import { getRoomDetails, listFeatures } from "@/server/services/room-service";

export const metadata: Metadata = { title: "Editar sala" };

export default async function EditRoomPage({
  params,
}: PageProps<"/admin/rooms/[id]/edit">) {
  await requireAdmin();

  const parsedId = roomIdSchema.safeParse((await params).id);
  // Unlike the reservation page, inactive rooms are found here: this is where they are reactivated.
  const room = parsedId.success ? await getRoomDetails(parsedId.data) : null;
  if (!room) notFound();
  const features = await listFeatures();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href="/admin/rooms"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2 self-start",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Salas cadastradas
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">
        Editar {room.name}
      </h1>

      <Card>
        <CardContent>
          <RoomForm action={updateRoomAction} features={features} room={room} />
        </CardContent>
      </Card>
    </div>
  );
}
