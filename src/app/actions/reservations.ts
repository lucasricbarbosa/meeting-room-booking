"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DomainError } from "@/domain/errors";
import { businessToUtc } from "@/domain/time";
import type { ActionResult } from "@/lib/action-result";
import {
  cancelReservationSchema,
  createReservationSchema,
} from "@/schemas/reservation";
import { requireUser } from "@/server/auth";
import { BUSINESS_TIMEZONE } from "@/server/env";
import {
  cancelReservation,
  createReservation,
} from "@/server/services/reservation-service";

export async function createReservationAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = createReservationSchema.safeParse({
    roomId: formData.get("roomId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title") ?? undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { roomId, date, startTime, endTime, title } = parsed.data;
  try {
    await createReservation(
      user,
      {
        roomId,
        startsAt: businessToUtc(date, startTime, BUSINESS_TIMEZONE),
        endsAt: businessToUtc(date, endTime, BUSINESS_TIMEZONE),
        title,
      },
      new Date(),
    );
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, code: error.code, message: error.message };
    }
    console.error(
      JSON.stringify({
        action: "createReservation",
        userId: user.id,
        code: "INTERNAL_ERROR",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Não foi possível criar a reserva. Tente novamente.",
    };
  }

  revalidatePath(`/rooms/${roomId}/reserve`);
  revalidatePath("/me/reservations");
  // Outside the try: redirect() works by throwing, and the catch would swallow it.
  // The destination page reads created=1 to show the success toast.
  redirect("/me/reservations?created=1");
}

export async function cancelReservationAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = cancelReservationSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Reserva inválida. Recarregue a página.",
    };
  }

  try {
    // Ownership is checked in the service against the session user, never against anything in the form.
    await cancelReservation(user, parsed.data.reservationId, new Date());
  } catch (error) {
    if (error instanceof DomainError) {
      return { ok: false, code: error.code, message: error.message };
    }
    console.error(
      JSON.stringify({
        action: "cancelReservation",
        userId: user.id,
        code: "INTERNAL_ERROR",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Não foi possível cancelar a reserva. Tente novamente.",
    };
  }

  revalidatePath("/me/reservations");
  // The freed slot must disappear from the occupancy of whichever room it was in.
  revalidatePath("/rooms/[id]/reserve", "page");
  return { ok: true, data: undefined };
}
