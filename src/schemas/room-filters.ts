import { z } from "zod";
import type { RoomFilters } from "@/domain/room";

type SearchParams = Record<string, string | string[] | undefined>;

const SLUG_PATTERN = /^[a-z0-9-]+$/;

// z.string() first: a repeated param arrives as string[] and is rejected like any other invalid value.
// Number("abc") is NaN, which z.number() rejects; Number("") is 0, which min(1) rejects.
const minCapacitySchema = z
  .string()
  .transform(Number)
  .pipe(z.number().int().min(1));

const featuresSchema = z.string().transform((value) => {
  const slugs = value.split(",").map((slug) => slug.trim());
  return [...new Set(slugs.filter((slug) => SLUG_PATTERN.test(slug)))];
});

// Each field is parsed on its own, so a broken minCapacity does not discard valid features.
export function parseRoomFilters(searchParams: SearchParams): RoomFilters {
  const minCapacity = minCapacitySchema.safeParse(searchParams["minCapacity"]);
  const features = featuresSchema.safeParse(searchParams["features"]);

  return {
    minCapacity: minCapacity.success ? minCapacity.data : undefined,
    features: features.success ? features.data : [],
  };
}

// Built by hand instead of URLSearchParams so the commas stay readable in the address bar.
export function buildRoomsHref(filters: RoomFilters): string {
  const params: string[] = [];
  if (filters.minCapacity) params.push(`minCapacity=${filters.minCapacity}`);
  if (filters.features.length > 0) {
    const slugs = filters.features.map(encodeURIComponent).join(",");
    params.push(`features=${slugs}`);
  }
  return params.length > 0 ? `/rooms?${params.join("&")}` : "/rooms";
}
