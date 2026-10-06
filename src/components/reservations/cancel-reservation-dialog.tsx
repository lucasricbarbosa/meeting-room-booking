"use client";

import { CircleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelReservationAction } from "@/app/actions/reservations";
import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type CancelReservationDialogProps = {
  reservationId: string;
  summary: string;
};

export function CancelReservationDialog({
  reservationId,
  summary,
}: CancelReservationDialogProps) {
  const [open, setOpen] = useState(false);
  // useTransition instead of useActionState: the error must be cleared when the dialog is reopened.
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return;
    setOpen(nextOpen);
    setError(null);
  }

  function cancel(formData: FormData) {
    startTransition(async () => {
      const result = await cancelReservationAction(null, formData);
      if (result.ok) {
        setOpen(false);
        // No redirect here, so a client toast is not lost (unlike creating a reservation).
        toast.success("Reserva cancelada.");
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Cancelar reserva: ${summary}`}
          className="sm:self-center"
        >
          Cancelar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar esta reserva?</AlertDialogTitle>
          <AlertDialogDescription className="tabular-nums">
            {summary}. O horário fica livre para outras pessoas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <form action={cancel}>
          {/* The only input: who is cancelling comes from the session, on the server. */}
          <input type="hidden" name="reservationId" value={reservationId} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Voltar</AlertDialogCancel>
            {/* A plain submit, not AlertDialogAction: that one would close the dialog before the answer. */}
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Spinner aria-hidden="true" />}
              {isPending ? "Cancelando…" : "Cancelar reserva"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
