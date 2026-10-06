import { ArrowLeft, Clock, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { utcToBusiness } from "@/domain/time";
import { formatDuration } from "@/lib/format-duration";
import { createReservationSchema } from "@/schemas/reservation";
import { requireUser } from "@/server/auth";
import { BUSINESS_TIMEZONE } from "@/server/env";
import { listDayReservations } from "@/server/services/reservation-service";
import { getActiveRoom } from "@/server/services/room-service";

export const metadata: Metadata = { title: "Reservar sala" };

export default async function ReserveRoomPage({
  params,
  searchParams,
}: PageProps<"/rooms/[id]/reserve">) {
  await requireUser();

  const { id } = await params;
  // Same criterion as the room list: an inactive room cannot be booked, so it has no page.
  const room = await getActiveRoom(id);
  if (!room) notFound();

  const today = utcToBusiness(new Date(), BUSINESS_TIMEZONE).date;
  // An invalid or repeated date falls back to today instead of breaking the page.
  const parsedDate = createReservationSchema.shape.date.safeParse(
    (await searchParams)["date"],
  );
  const date = parsedDate.success ? parsedDate.data : today;
  const reservations = await listDayReservations(room.id, date);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href="/rooms"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2 self-start",
        })}
      >
        <ArrowLeft aria-hidden="true" />
        Salas
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reservar {room.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 tabular-nums">
            <Users aria-hidden="true" className="size-4" />
            {room.capacity} {room.capacity === 1 ? "pessoa" : "pessoas"}
          </span>
          {room.location && (
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-4" />
              {room.location}
            </span>
          )}
          <span className="flex items-center gap-1.5 tabular-nums">
            <Clock aria-hidden="true" className="size-4" />
            Reservas de até {formatDuration(room.maxBookingMinutes)}
          </span>
        </p>
      </div>

      <Card>
        <CardContent>
          <ReservationForm
            roomId={room.id}
            date={date}
            today={today}
            timeZone={BUSINESS_TIMEZONE}
            reservations={reservations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
