"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DomainError } from "@/domain/errors";
import { businessToUtc } from "@/domain/time";
import type { ActionResult } from "@/lib/action-result";
import { createReservationSchema } from "@/schemas/reservation";
import { requireUser } from "@/server/auth";
import { BUSINESS_TIMEZONE } from "@/server/env";
import { createReservation } from "@/server/services/reservation-service";

export async function createReservationAction(
  _previous: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
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
    const reservation = await createReservation(
      user,
      {
        roomId,
        startsAt: businessToUtc(date, startTime, BUSINESS_TIMEZONE),
        endsAt: businessToUtc(date, endTime, BUSINESS_TIMEZONE),
        title,
      },
      new Date(),
    );
    revalidatePath(`/rooms/${roomId}/reserve`);
    revalidatePath("/me/reservations");
    return { ok: true, data: reservation };
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
}
