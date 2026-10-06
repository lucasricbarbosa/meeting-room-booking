import { cn } from "cn";
import { CancelReservationDialog } from "@/components/reservations/cancel-reservation-dialog";
import { Badge } from "@/components/ui/badge";
import type { UserReservation } from "@/domain/reservation";
import { isCancellable } from "@/domain/reservation-rules";
import { formatReservationRange } from "@/domain/time";

type ReservationItemProps = {
  reservation: UserReservation;
  now: Date;
  timeZone: string;
};

export function ReservationItem({
  reservation,
  now,
  timeZone,
}: ReservationItemProps) {
  const range = formatReservationRange(reservation, timeZone);
  const isCancelled = reservation.status === "CANCELLED";
  const isInProgress =
    !isCancelled && reservation.startsAt <= now && reservation.endsAt > now;

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:justify-between",
        isCancelled && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{reservation.roomName}</span>
          {/* Text, not only the faded style, so the status is not conveyed by opacity alone. */}
          {isCancelled && <Badge variant="outline">Cancelada</Badge>}
          {isInProgress && <Badge variant="secondary">Em andamento</Badge>}
        </p>
        <p className="text-sm tabular-nums">{range}</p>
        {reservation.title && (
          <p className="truncate text-sm text-muted-foreground">
            {reservation.title}
          </p>
        )}
      </div>
      {isCancellable(reservation, now) && (
        <CancelReservationDialog
          reservationId={reservation.id}
          summary={`${reservation.roomName}, ${range}`}
        />
      )}
    </li>
  );
}
