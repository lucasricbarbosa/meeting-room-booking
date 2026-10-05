"use client";

import { CircleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { signInAction } from "@/app/actions/auth";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/user-avatar";
import type { UserSummary } from "@/domain/user";

type SignInUserListProps = {
  users: UserSummary[];
  currentUserId: string | null;
};

export function SignInUserList({ users, currentUserId }: SignInUserListProps) {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  // useActionState does not tell which button submitted, so the clicked row is tracked here.
  const [clickedId, setClickedId] = useState<string | null>(null);

  const groups = [
    { label: "Usuários", users: users.filter((u) => u.role === "USER") },
    { label: "Administrador", users: users.filter((u) => u.role === "ADMIN") },
  ];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state && !state.ok && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}

      {groups.map(
        (group) =>
          group.users.length > 0 && (
            // A disabled fieldset disables every button inside it while the action runs.
            <fieldset
              key={group.label}
              disabled={isPending}
              className="flex flex-col gap-2"
            >
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </legend>
              {group.users.map((user) => (
                <Button
                  key={user.id}
                  type="submit"
                  name="userId"
                  value={user.id}
                  variant="outline"
                  onClick={() => setClickedId(user.id)}
                  className="h-14 w-full justify-start gap-3 px-3 text-left"
                >
                  <UserAvatar name={user.name} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{user.name}</span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </span>
                  {user.id === currentUserId && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                  {user.role === "ADMIN" && <Badge>Admin</Badge>}
                  {isPending && clickedId === user.id && (
                    <Spinner aria-label="Entrando" />
                  )}
                </Button>
              ))}
            </fieldset>
          ),
      )}
    </form>
  );
}
