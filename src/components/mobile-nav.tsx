"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavLinks, isActivePath } from "@/components/nav-links";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menu"
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle>Reserva de Salas</SheetTitle>
        </SheetHeader>
        <nav aria-label="Principal" className="flex flex-col gap-1 px-4">
          {getNavLinks(isAdmin).map((link) => {
            const isActive = isActivePath(pathname, link.href);
            return (
              // SheetClose closes the menu after navigating.
              <SheetClose key={link.href} asChild>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 justify-start",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
