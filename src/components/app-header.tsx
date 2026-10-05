import { BrandLogo } from "@/components/brand-logo";
import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import type { UserSummary } from "@/domain/user";

export function AppHeader({ user }: { user: UserSummary }) {
  const isAdmin = user.role === "ADMIN";

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center gap-2 px-4 md:gap-6">
        <MobileNav isAdmin={isAdmin} />
        <BrandLogo />
        <MainNav isAdmin={isAdmin} />
        <div className="ml-auto">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
