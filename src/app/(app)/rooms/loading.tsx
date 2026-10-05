import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_CARDS = 6;

export default function RoomsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only">Carregando salas…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-full sm:w-96" />
      </div>
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PLACEHOLDER_CARDS }, (_, index) => (
          <Skeleton key={index} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
