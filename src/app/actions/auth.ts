"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { signInSchema } from "@/schemas/auth";
import {
  clearSessionCookie,
  requireUser,
  setSessionCookie,
} from "@/server/auth";
import { getUserById } from "@/server/services/user-service";

// The only action without requireUser: choosing who you are is the (simulated) login itself.
export async function signInAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Escolha um usuário da lista.",
    };
  }

  try {
    const user = await getUserById(parsed.data.userId);
    if (!user) {
      return {
        ok: false,
        code: "USER_NOT_FOUND",
        message: "Usuário não encontrado. Recarregue a página.",
      };
    }
    await setSessionCookie(user.id);
  } catch (error) {
    console.error(
      JSON.stringify({
        action: "signIn",
        userId: parsed.data.userId,
        code: "INTERNAL_ERROR",
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Não foi possível entrar. Tente novamente.",
    };
  }

  // Outside the try: redirect() works by throwing, and the catch would swallow it.
  redirect("/rooms");
}

export async function signOutAction(): Promise<void> {
  await requireUser();
  await clearSessionCookie();
  redirect("/sign-in");
}
