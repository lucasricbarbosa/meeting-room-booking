"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type DateFieldProps = {
  roomId: string;
  date: string;
  today: string;
  errors: Array<{ message: string }> | undefined;
};

// The selected day lives in the URL, so the server loads its reservations and back/forward works.
export function DateField({ roomId, date, today, errors }: DateFieldProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Uncontrolled so typing a date is never interrupted; this only catches back/forward.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.value = date;
  }, [date]);

  function changeDate(value: string) {
    // A past date is also what the browser reports mid-typing (year "0002"), so it is not navigated to.
    if (!value || value < today) return;
    startTransition(() => {
      router.push(`/rooms/${roomId}/reserve?date=${value}`, { scroll: false });
    });
  }

  return (
    <Field data-invalid={Boolean(errors)}>
      <FieldLabel htmlFor="date">Data</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          ref={input}
          id="date"
          name="date"
          type="date"
          defaultValue={date}
          min={today}
          onChange={(event) => changeDate(event.target.value)}
          aria-invalid={Boolean(errors)}
          className="w-full sm:w-48"
        />
        {isPending && <Spinner aria-label="Carregando reservas do dia" />}
      </div>
      <FieldError errors={errors} />
    </Field>
  );
}
