import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/server/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">
        {children}
      </main>
    </>
  );
}
