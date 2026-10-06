import { Skeleton } from "@/components/ui/skeleton";

// Without this file, the closest boundary would be rooms/loading.tsx, which draws the room cards grid.
export default function ReserveRoomLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
      aria-busy="true"
    >
      <span className="sr-only">Carregando sala…</span>
      <Skeleton className="h-8 w-20" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[30rem] rounded-xl" />
    </div>
  );
}
