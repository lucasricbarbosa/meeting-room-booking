import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createRoomAction } from "@/app/actions/rooms";
import { RoomForm } from "@/components/admin/room-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/server/auth";
import { listFeatures } from "@/server/services/room-service";

export const metadata: Metadata = { title: "Nova sala" };

export default async function NewRoomPage() {
  await requireAdmin();

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

      <h1 className="text-2xl font-semibold tracking-tight">Nova sala</h1>

      <Card>
        <CardContent>
          <RoomForm action={createRoomAction} features={features} />
        </CardContent>
      </Card>
    </div>
  );
}
