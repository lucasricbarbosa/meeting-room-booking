import { CalendarX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ReservationSection } from "@/components/reservations/reservation-section";
import { SuccessToast } from "@/components/success-toast";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth";
import { BUSINESS_TIMEZONE } from "@/server/env";
import { listUserReservations } from "@/server/services/reservation-service";

export const metadata: Metadata = { title: "Minhas reservas" };

export default async function MyReservationsPage({
  searchParams,
}: PageProps<"/me/reservations">) {
  const user = await requireUser();

  const now = new Date();
  const { upcoming, past } = await listUserReservations(user.id, now);
  // Set by createReservationAction's redirect; SuccessToast removes it from the URL.
  const created = (await searchParams)["created"] === "1";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {created && <SuccessToast message="Reserva criada." />}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Minhas reservas
        </h1>
        <p className="text-sm text-muted-foreground">
          Você pode cancelar uma reserva até o horário de início.
        </p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <CalendarX
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Você ainda não tem reservas</p>
            <p className="text-sm text-muted-foreground">
              Escolha uma sala e reserve um horário.
            </p>
          </div>
          <Link href="/rooms" className={buttonVariants()}>
            Ver salas
          </Link>
        </div>
      ) : (
        <>
          <ReservationSection
            id="upcoming-heading"
            title="Próximas"
            reservations={upcoming}
            now={now}
            timeZone={BUSINESS_TIMEZONE}
            empty={
              <>
                Nenhuma reserva futura.{" "}
                <Link
                  href="/rooms"
                  className="text-foreground underline underline-offset-4"
                >
                  Reservar uma sala
                </Link>
              </>
            }
          />
          <ReservationSection
            id="past-heading"
            title="Anteriores"
            reservations={past}
            now={now}
            timeZone={BUSINESS_TIMEZONE}
            empty="Nenhuma reserva anterior."
          />
        </>
      )}
    </div>
  );
}
