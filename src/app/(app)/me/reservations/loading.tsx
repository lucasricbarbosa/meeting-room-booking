import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_ITEMS = 3;

export default function MyReservationsLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      aria-busy="true"
    >
      <span className="sr-only">Carregando reservas…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        {Array.from({ length: PLACEHOLDER_ITEMS }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
