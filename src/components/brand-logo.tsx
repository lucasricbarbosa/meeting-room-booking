import { CalendarClock } from "lucide-react";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
        <CalendarClock className="size-4" aria-hidden="true" />
      </span>
      Reserva de Salas
    </Link>
  );
}
