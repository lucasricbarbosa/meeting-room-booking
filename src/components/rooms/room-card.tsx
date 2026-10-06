import { Clock, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { FeatureIcon } from "@/components/rooms/feature-icon";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RoomListItem } from "@/domain/room";
import { formatDuration } from "@/lib/format-duration";

export function RoomCard({ room }: { room: RoomListItem }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{room.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <dl className="flex flex-col gap-1.5 text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt>
              <Users aria-hidden="true" className="size-4" />
              <span className="sr-only">Capacidade</span>
            </dt>
            <dd className="tabular-nums">
              {room.capacity} {room.capacity === 1 ? "pessoa" : "pessoas"}
            </dd>
          </div>
          {room.location && (
            <div className="flex items-center gap-2">
              <dt>
                <MapPin aria-hidden="true" className="size-4" />
                <span className="sr-only">Local</span>
              </dt>
              <dd>{room.location}</dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <dt>
              <Clock aria-hidden="true" className="size-4" />
              <span className="sr-only">Duração máxima</span>
            </dt>
            <dd className="tabular-nums">
              Reservas de até {formatDuration(room.maxBookingMinutes)}
            </dd>
          </div>
        </dl>
        {room.features.length > 0 && (
          <ul aria-label="Recursos" className="flex flex-wrap gap-1.5">
            {room.features.map((feature) => (
              <li key={feature.slug}>
                <Badge variant="secondary">
                  <FeatureIcon slug={feature.slug} />
                  {feature.name}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/rooms/${room.id}/reserve`}
          aria-label={`Reservar ${room.name}`}
          className={buttonVariants({ className: "w-full" })}
        >
          Reservar
        </Link>
      </CardFooter>
    </Card>
  );
}
