"use client";

import { CircleAlert, TriangleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { createReservationAction } from "@/app/actions/reservations";
import { DateField } from "@/components/reservations/date-field";
import { DayTimeline } from "@/components/reservations/day-timeline";
import {
  END_TIME_OPTIONS,
  START_TIME_OPTIONS,
  TimeSelect,
} from "@/components/reservations/time-select";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { OccupiedSlot } from "@/domain/reservation";
import { overlaps } from "@/domain/reservation-rules";
import {
  businessToUtc,
  formatBusinessDay,
  formatTimeRange,
} from "@/domain/time";

type ReservationFormProps = {
  roomId: string;
  date: string;
  today: string;
  timeZone: string;
  reservations: OccupiedSlot[];
};

export function ReservationForm({
  roomId,
  date,
  today,
  timeZone,
  reservations,
}: ReservationFormProps) {
  const [state, formAction, isPending] = useActionState(
    createReservationAction,
    null,
  );
  // Controlled: React resets uncontrolled fields after a form action, which would wipe them on an error.
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");

  // "HH:mm" strings compare correctly as text.
  const draft =
    startTime && endTime && endTime > startTime
      ? {
          startsAt: businessToUtc(date, startTime, timeZone),
          endsAt: businessToUtc(date, endTime, timeZone),
        }
      : null;
  // Only a preview with the same rule as the server: the action still checks it inside the transaction.
  const conflict = draft && reservations.find((slot) => overlaps(slot, draft));

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  function errorsFor(field: string) {
    return fieldErrors?.[field]?.map((message) => ({ message }));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="roomId" value={roomId} />

      {state && !state.ok && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}

      <DateField
        roomId={roomId}
        date={date}
        today={today}
        errors={errorsFor("date")}
      />

      <section aria-labelledby="day-heading" className="flex flex-col gap-3">
        <h2 id="day-heading" className="text-sm font-medium tabular-nums">
          Ocupação de {formatBusinessDay(date)}
        </h2>
        <DayTimeline
          date={date}
          timeZone={timeZone}
          slots={reservations}
          draft={draft}
          hasConflict={Boolean(conflict)}
        />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errorsFor("startTime"))}>
          <FieldLabel htmlFor="startTime">Início</FieldLabel>
          <TimeSelect
            id="startTime"
            name="startTime"
            value={startTime}
            options={START_TIME_OPTIONS}
            onValueChange={setStartTime}
            invalid={Boolean(errorsFor("startTime"))}
          />
          <FieldError errors={errorsFor("startTime")} />
        </Field>
        <Field data-invalid={Boolean(errorsFor("endTime"))}>
          <FieldLabel htmlFor="endTime">Término</FieldLabel>
          <TimeSelect
            id="endTime"
            name="endTime"
            value={endTime}
            options={END_TIME_OPTIONS}
            onValueChange={setEndTime}
            invalid={Boolean(errorsFor("endTime"))}
          />
          <FieldError errors={errorsFor("endTime")} />
        </Field>
      </div>

      {/* Always rendered: a live region only announces changes if it already exists. */}
      <div aria-live="polite">
        {conflict && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
            <span className="tabular-nums">
              Conflita com um horário já reservado (
              {formatTimeRange(conflict, timeZone)}).
            </span>
          </p>
        )}
      </div>

      <Field data-invalid={Boolean(errorsFor("title"))}>
        <FieldLabel htmlFor="title">Título (opcional)</FieldLabel>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder="Ex.: Planejamento da sprint"
          aria-invalid={Boolean(errorsFor("title"))}
        />
        <FieldError errors={errorsFor("title")} />
      </Field>

      {/* Not disabled on conflict: the server is the one that decides. */}
      <Button type="submit" disabled={isPending} className="sm:self-start">
        {isPending && <Spinner aria-hidden="true" />}
        {isPending ? "Reservando…" : "Reservar"}
      </Button>
    </form>
  );
}
