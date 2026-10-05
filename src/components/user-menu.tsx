"use client";

import { ChevronDown, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import type { UserSummary } from "@/domain/user";

export function UserMenu({ user }: { user: UserSummary }) {
  const isAdmin = user.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 px-1.5">
          <UserAvatar name={user.name} />
          {/* Visible from sm up; below that it still names the button for screen readers. */}
          <span className="sr-only sm:not-sr-only">{user.name}</span>
          {isAdmin && <Badge className="hidden sm:inline-flex">Admin</Badge>}
          <ChevronDown aria-hidden="true" className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-foreground">
              {user.name}
            </span>
            <span className="truncate font-normal">{user.email}</span>
          </span>
          {isAdmin && <Badge>Admin</Badge>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/sign-in">
            <Users aria-hidden="true" />
            Trocar usuário
          </Link>
        </DropdownMenuItem>
        <form action={signOutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden="true" />
              Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
