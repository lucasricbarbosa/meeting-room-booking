"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { RoomFeaturesField } from "@/components/admin/room-features-field";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { FeatureSummary, RoomDetails } from "@/domain/room";
import type { ActionResult } from "@/lib/action-result";
import {
  ROOM_CAPACITY_MIN,
  ROOM_DESCRIPTION_MAX,
  ROOM_LOCATION_MAX,
  ROOM_NAME_MAX,
} from "@/schemas/room";

type RoomFormProps = {
  action: (
    previous: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  features: FeatureSummary[];
  // Absent when creating a room.
  room?: RoomDetails;
};

export function RoomForm({ action, features, room }: RoomFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  // Controlled: React resets uncontrolled fields after a form action, which would wipe them on an error.
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room ? String(room.capacity) : "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [description, setDescription] = useState(room?.description ?? "");
  const [featureSlugs, setFeatureSlugs] = useState(room?.featureSlugs ?? []);
  const [isActive, setIsActive] = useState(room?.isActive ?? true);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  function errorsFor(field: string) {
    return fieldErrors?.[field]?.map((message) => ({ message }));
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {room && <input type="hidden" name="roomId" value={room.id} />}

      {state && !state.ok && (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>{state.message}</AlertTitle>
        </Alert>
      )}

      <Field data-invalid={Boolean(errorsFor("name"))}>
        <FieldLabel htmlFor="name">Nome</FieldLabel>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={ROOM_NAME_MAX}
          aria-invalid={Boolean(errorsFor("name"))}
        />
        <FieldError errors={errorsFor("name")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errorsFor("capacity"))}>
          <FieldLabel htmlFor="capacity">Capacidade (pessoas)</FieldLabel>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            inputMode="numeric"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            required
            min={ROOM_CAPACITY_MIN}
            step={1}
            className="tabular-nums"
            aria-invalid={Boolean(errorsFor("capacity"))}
          />
          <FieldError errors={errorsFor("capacity")} />
        </Field>
        <Field data-invalid={Boolean(errorsFor("location"))}>
          <FieldLabel htmlFor="location">Local (opcional)</FieldLabel>
          <Input
            id="location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={ROOM_LOCATION_MAX}
            placeholder="Ex.: 3º andar"
            aria-invalid={Boolean(errorsFor("location"))}
          />
          <FieldError errors={errorsFor("location")} />
        </Field>
      </div>

      <Field data-invalid={Boolean(errorsFor("description"))}>
        <FieldLabel htmlFor="description">Descrição (opcional)</FieldLabel>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={ROOM_DESCRIPTION_MAX}
          aria-invalid={Boolean(errorsFor("description"))}
        />
        <FieldError errors={errorsFor("description")} />
      </Field>

      <RoomFeaturesField
        features={features}
        value={featureSlugs}
        onValueChange={setFeatureSlugs}
        errors={errorsFor("features")}
      />

      <Field orientation="horizontal">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <FieldLabel htmlFor="isActive" className="flex-col items-start gap-0.5">
          Sala ativa
          <span className="font-normal text-muted-foreground">
            Salas inativas não aparecem na listagem e não aceitam reservas.
          </span>
        </FieldLabel>
      </Field>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Link
          href="/admin/rooms"
          className={buttonVariants({ variant: "outline" })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner aria-hidden="true" />}
          {isPending ? "Salvando…" : room ? "Salvar alterações" : "Criar sala"}
        </Button>
      </div>
    </form>
  );
}
