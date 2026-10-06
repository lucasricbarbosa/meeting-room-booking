import { cn } from "cn";
import type { OccupiedSlot } from "@/domain/reservation";
import type { TimeRange } from "@/domain/reservation-rules";
import { businessToUtc, formatTimeRange } from "@/domain/time";

const FIRST_HOUR = 8;
const LAST_HOUR = 20;
const HOURS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR + 1 },
  (_, index) => FIRST_HOUR + index,
);

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function toPercent(fraction: number): string {
  return `${fraction * 100}%`;
}

type Position = { left: string; width: string };

// Works on UTC instants, so the position is exact to the minute and needs no wall-clock math.
// Ranges are clipped to the visible hours; one entirely outside them is not drawn (the list still shows it).
function getPosition(range: TimeRange, visible: TimeRange): Position | null {
  const visibleStart = visible.startsAt.getTime();
  const total = visible.endsAt.getTime() - visibleStart;
  const start = Math.max(range.startsAt.getTime(), visibleStart);
  const end = Math.min(range.endsAt.getTime(), visible.endsAt.getTime());
  if (end <= start) return null;
  return {
    left: toPercent((start - visibleStart) / total),
    width: toPercent((end - start) / total),
  };
}

function hourOffset(hour: number): string {
  return toPercent((hour - FIRST_HOUR) / (LAST_HOUR - FIRST_HOUR));
}

type DayTimelineProps = {
  date: string;
  timeZone: string;
  slots: OccupiedSlot[];
  draft: TimeRange | null;
  hasConflict: boolean;
};

export function DayTimeline({
  date,
  timeZone,
  slots,
  draft,
  hasConflict,
}: DayTimelineProps) {
  const visible = {
    startsAt: businessToUtc(date, formatHour(FIRST_HOUR), timeZone),
    endsAt: businessToUtc(date, formatHour(LAST_HOUR), timeZone),
  };
  const draftPosition = draft && getPosition(draft, visible);

  return (
    <div className="flex flex-col gap-3">
      {/* Visual only: the list below says the same thing to screen readers. */}
      <div aria-hidden="true" className="flex flex-col gap-1">
        <div className="relative h-12 overflow-hidden rounded-lg border bg-muted/40">
          {HOURS.map((hour) => (
            <span
              key={hour}
              className="absolute inset-y-0 border-l border-border"
              style={{ left: hourOffset(hour) }}
            />
          ))}
          {slots.map((slot) => {
            const position = getPosition(slot, visible);
            return (
              position && (
                <span
                  key={slot.id}
                  className="absolute inset-y-1.5 rounded-md bg-muted-foreground/35"
                  style={position}
                />
              )
            );
          })}
          {draftPosition && (
            <span
              className={cn(
                "absolute inset-y-1 rounded-md border-2",
                hasConflict
                  ? "border-destructive bg-destructive/20"
                  : "border-primary bg-primary/15",
              )}
              style={draftPosition}
            />
          )}
        </div>
        <div className="relative h-4 text-xs text-muted-foreground tabular-nums">
          {HOURS.map((hour) => (
            <span
              key={hour}
              className={cn(
                "absolute -translate-x-1/2",
                hour === FIRST_HOUR && "translate-x-0",
                hour === LAST_HOUR && "-translate-x-full",
                // Every other label on small screens, or they overlap.
                hour % 2 === 1 && "hidden sm:inline",
              )}
              style={{ left: hourOffset(hour) }}
            >
              {String(hour).padStart(2, "0")}h
            </span>
          ))}
        </div>
      </div>

      {slots.length > 0 ? (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <span id="occupied-label" className="text-muted-foreground">
            Horários ocupados:
          </span>
          <ul
            aria-labelledby="occupied-label"
            className="flex flex-wrap gap-x-3 gap-y-1 tabular-nums"
          >
            {slots.map((slot) => (
              <li key={slot.id}>{formatTimeRange(slot, timeZone)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma reserva neste dia.
        </p>
      )}
    </div>
  );
}
