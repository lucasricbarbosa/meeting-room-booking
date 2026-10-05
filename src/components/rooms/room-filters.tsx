"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FeatureIcon } from "@/components/rooms/feature-icon";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FeatureSummary, RoomFilters as Filters } from "@/domain/room";
import { buildRoomsHref } from "@/schemas/room-filters";

const CAPACITY_OPTIONS = [4, 6, 8, 10, 12, 20];
// Radix Select does not accept "" as an item value.
const ANY_CAPACITY = "any";

function formatCapacity(minCapacity: number | undefined): string {
  return minCapacity ? `${minCapacity}+ pessoas` : "Qualquer capacidade";
}

type RoomFiltersProps = {
  filters: Filters;
  features: FeatureSummary[];
};

// Controls read only from props (the URL), so back/forward updates them without local state.
export function RoomFilters({ filters, features }: RoomFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // A value typed in the URL that is not in the list still needs an option to be shown.
  const capacityOptions =
    filters.minCapacity && !CAPACITY_OPTIONS.includes(filters.minCapacity)
      ? [...CAPACITY_OPTIONS, filters.minCapacity].sort((a, b) => a - b)
      : CAPACITY_OPTIONS;
  const hasFilters =
    Boolean(filters.minCapacity) || filters.features.length > 0;

  function navigate(next: Filters) {
    startTransition(() => {
      router.push(buildRoomsHref(next), { scroll: false });
    });
  }

  // Controls are disabled while navigating: a second change would be built from stale props
  // and silently drop the first one.
  return (
    <fieldset className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <legend className="sr-only">Filtros</legend>
      <Select
        value={filters.minCapacity ? String(filters.minCapacity) : ANY_CAPACITY}
        onValueChange={(value) =>
          navigate({
            ...filters,
            minCapacity: value === ANY_CAPACITY ? undefined : Number(value),
          })
        }
        disabled={isPending}
      >
        <SelectTrigger aria-label="Capacidade mínima" className="w-44">
          {/* Explicit label: Radix only fills it after hydration, so the server HTML would show it empty. */}
          <SelectValue>{formatCapacity(filters.minCapacity)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY_CAPACITY}>
            {formatCapacity(undefined)}
          </SelectItem>
          {capacityOptions.map((capacity) => (
            <SelectItem key={capacity} value={String(capacity)}>
              {formatCapacity(capacity)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleGroup
        type="multiple"
        variant="outline"
        aria-label="Recursos"
        value={filters.features}
        onValueChange={(slugs) => navigate({ ...filters, features: slugs })}
        disabled={isPending}
        className="flex-wrap"
      >
        {features.map((feature) => (
          <ToggleGroupItem
            key={feature.slug}
            value={feature.slug}
            className="data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
          >
            <FeatureIcon slug={feature.slug} />
            {feature.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {hasFilters && (
        <Link
          href="/rooms"
          scroll={false}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Limpar
        </Link>
      )}
      {isPending && <Spinner aria-label="Atualizando salas" />}
    </fieldset>
  );
}
