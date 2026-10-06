import type { ReactNode } from "react";
import { ReservationItem } from "@/components/reservations/reservation-item";
import type { UserReservation } from "@/domain/reservation";

type ReservationSectionProps = {
  id: string;
  title: string;
  reservations: UserReservation[];
  now: Date;
  timeZone: string;
  empty: ReactNode;
};

export function ReservationSection({
  id,
  title,
  reservations,
  now,
  timeZone,
  empty,
}: ReservationSectionProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {reservations.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {reservations.map((reservation) => (
            <ReservationItem
              key={reservation.id}
              reservation={reservation}
              now={now}
              timeZone={timeZone}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </section>
  );
}
