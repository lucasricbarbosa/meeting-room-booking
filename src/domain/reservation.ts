import type { TimeRange } from "./reservation-rules";

// What any user may see about someone else's booking: only when the room is busy.
export type OccupiedSlot = TimeRange & { id: string };

export type ReservationStatus = "ACTIVE" | "CANCELLED";

// What the owner sees of their own booking.
export type UserReservation = TimeRange & {
  id: string;
  title: string | null;
  status: ReservationStatus;
  roomName: string;
};
