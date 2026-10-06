import type { TimeRange } from "./reservation-rules";

// What any user may see about someone else's booking: only when the room is busy.
export type OccupiedSlot = TimeRange & { id: string };
