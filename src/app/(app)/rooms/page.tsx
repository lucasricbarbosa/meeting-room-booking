import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RoomCard } from "@/components/rooms/room-card";
import { RoomFilters } from "@/components/rooms/room-filters";
import { buttonVariants } from "@/components/ui/button";
import { parseRoomFilters } from "@/schemas/room-filters";
import { requireUser } from "@/server/auth";
import { listFeatures, listRooms } from "@/server/services/room-service";

export const metadata: Metadata = { title: "Salas" };

export default async function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  // The (app) layout does not re-render on every navigation, so the page checks the session itself.
  await requireUser();

  const parsed = parseRoomFilters(await searchParams);
  const features = await listFeatures();
  // A slug outside the catalog would empty the list without showing up in any filter chip.
  const filters = {
    ...parsed,
    features: parsed.features.filter((slug) =>
      features.some((feature) => feature.slug === slug),
    ),
  };
  const rooms = await listRooms(filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Salas</h1>
        <p className="text-sm text-muted-foreground">
          Filtre por capacidade e recursos e escolha uma sala para reservar.
        </p>
      </div>

      <RoomFilters filters={filters} features={features} />

      <p role="status" className="text-sm text-muted-foreground tabular-nums">
        {rooms.length === 1
          ? "1 sala encontrada"
          : `${rooms.length} salas encontradas`}
      </p>

      {rooms.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id} className="flex">
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
          <SearchX
            aria-hidden="true"
            className="size-8 text-muted-foreground"
          />
          <div className="flex flex-col gap-1">
            <p className="font-medium">Nenhuma sala atende a esses filtros</p>
            <p className="text-sm text-muted-foreground">
              Diminua a capacidade mínima ou desmarque algum recurso.
            </p>
          </div>
          <Link
            href="/rooms"
            className={buttonVariants({ variant: "outline" })}
          >
            Limpar filtros
          </Link>
        </div>
      )}
    </div>
  );
}
