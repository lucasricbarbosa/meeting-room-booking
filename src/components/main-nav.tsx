"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavLinks, isActivePath } from "@/components/nav-links";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MainNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {getNavLinks(isAdmin).map((link) => {
        const isActive = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
