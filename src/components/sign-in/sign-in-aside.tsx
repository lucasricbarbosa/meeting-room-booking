import { CalendarClock } from "lucide-react";

export function SignInAside() {
  return (
    <div className="hidden flex-col items-center justify-center gap-6 bg-muted p-10 text-center lg:flex">
      <span className="flex size-20 items-center justify-center rounded-2xl bg-foreground text-background">
        <CalendarClock className="size-10" aria-hidden="true" />
      </span>
      <p className="max-w-xs text-lg font-medium text-balance">
        Reserve salas de reunião sem conflito de horário
      </p>
    </div>
  );
}
