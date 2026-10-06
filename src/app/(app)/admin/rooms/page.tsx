import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SuccessToast } from "@/components/success-toast";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/server/auth";
import { listAllRooms } from "@/server/services/room-service";

export const metadata: Metadata = { title: "Salas cadastradas" };

export default async function AdminRoomsPage({
  searchParams,
}: PageProps<"/admin/rooms">) {
  await requireAdmin();

  const rooms = await listAllRooms();
  // Set by the room actions' redirect; SuccessToast removes them from the URL.
  const { created, updated } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      {created === "1" && <SuccessToast message="Sala criada." />}
      {updated === "1" && <SuccessToast message="Sala atualizada." />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Salas cadastradas
          </h1>
          <p className="text-sm text-muted-foreground">
            Salas não são excluídas: desative para tirá-las da listagem.
          </p>
        </div>
        <Link href="/admin/rooms/new" className={buttonVariants()}>
          <Plus aria-hidden="true" />
          Nova sala
        </Link>
      </div>

      {rooms.length === 0 ? (
        <p className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma sala cadastrada.
        </p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Capacidade</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow
                  key={room.id}
                  className={
                    room.isActive ? undefined : "text-muted-foreground"
                  }
                >
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {room.capacity}
                  </TableCell>
                  <TableCell>{room.location ?? "—"}</TableCell>
                  <TableCell className="whitespace-normal">
                    {room.features.length > 0
                      ? room.features.map((feature) => feature.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.isActive ? "secondary" : "outline"}>
                      {room.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/rooms/${room.id}/edit`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      })}
                    >
                      <Pencil aria-hidden="true" />
                      Editar
                      <span className="sr-only"> {room.name}</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
