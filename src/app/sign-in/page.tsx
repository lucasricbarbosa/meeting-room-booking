import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { SignInAside } from "@/components/sign-in/sign-in-aside";
import { SignInUserList } from "@/components/sign-in/sign-in-user-list";
import { getCurrentUser } from "@/server/auth";
import { listUsers } from "@/server/services/user-service";

export const metadata: Metadata = { title: "Entrar" };

// No requireUser here: this page must work without a session, and also with one ("Trocar usuário").
export default async function SignInPage() {
  const [currentUser, users] = await Promise.all([
    getCurrentUser(),
    listUsers(),
  ]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <BrandLogo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-[360px] flex-col gap-6">
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Acesso rápido
              </h1>
              <p className="text-sm text-balance text-muted-foreground">
                Ambiente de demonstração. Escolha um usuário para entrar.
              </p>
            </div>
            <SignInUserList
              users={users}
              currentUserId={currentUser?.id ?? null}
            />
            <p className="text-center text-xs text-muted-foreground">
              Sem senha: as permissões são verificadas no servidor.
            </p>
          </div>
        </div>
      </div>
      <SignInAside />
    </div>
  );
}
