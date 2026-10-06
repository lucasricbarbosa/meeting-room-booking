"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DomainError } from "@/domain/errors";
import type { UserSummary } from "@/domain/user";
import type { ActionResult } from "@/lib/action-result";
import { roomIdSchema, roomSchema } from "@/schemas/room";
import { requireAdmin } from "@/server/auth";
import { createRoom, updateRoom } from "@/server/services/room-service";

export async function createRoomAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const parsed = parseRoomForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await createRoom(user, parsed.data);
  } catch (error) {
    return toErrorResult(error, "createRoom", user);
  }

  revalidateRooms();
  // Outside the try: redirect() works by throwing, and the catch would swallow it.
  redirect("/admin/rooms?created=1");
}

export async function updateRoomAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const roomId = roomIdSchema.safeParse(formData.get("roomId"));
  if (!roomId.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Sala inválida. Recarregue a página.",
    };
  }
  const parsed = parseRoomForm(formData);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await updateRoom(user, roomId.data, parsed.data);
  } catch (error) {
    return toErrorResult(error, "updateRoom", user);
  }

  revalidateRooms();
  redirect("/admin/rooms?updated=1");
}

function parseRoomForm(formData: FormData) {
  return roomSchema.safeParse({
    name: formData.get("name"),
    capacity: formData.get("capacity"),
    location: formData.get("location") ?? "",
    description: formData.get("description") ?? "",
    features: formData.getAll("features"),
    // An unchecked checkbox is simply absent from the form data.
    isActive: formData.get("isActive") === "on",
    maxBookingMinutes: formData.get("maxBookingMinutes"),
  });
}

function validationError(error: z.ZodError): ActionResult {
  return {
    ok: false,
    code: "VALIDATION_ERROR",
    message: "Revise os campos destacados.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

function toErrorResult(
  error: unknown,
  action: string,
  user: UserSummary,
): ActionResult {
  if (error instanceof DomainError) {
    if (error.code === "NAME_TAKEN") {
      return {
        ok: false,
        code: error.code,
        message: "Revise os campos destacados.",
        fieldErrors: { name: [error.message] },
      };
    }
    return { ok: false, code: error.code, message: error.message };
  }
  console.error(
    JSON.stringify({
      action,
      userId: user.id,
      code: "INTERNAL_ERROR",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  return {
    ok: false,
    code: "INTERNAL_ERROR",
    message: "Não foi possível salvar a sala. Tente novamente.",
  };
}

function revalidateRooms() {
  revalidatePath("/admin/rooms");
  revalidatePath("/rooms");
  // A deactivated room's reservation page must start answering 404.
  revalidatePath("/rooms/[id]/reserve", "page");
}
