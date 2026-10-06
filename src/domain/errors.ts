export type ErrorCode =
  | "VALIDATION_ERROR"
  | "USER_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "ROOM_NOT_FOUND"
  | "ROOM_INACTIVE"
  | "INVALID_RANGE"
  | "IN_THE_PAST"
  | "DURATION_TOO_SHORT"
  | "DURATION_TOO_LONG"
  | "ROOM_CONFLICT"
  | "TRY_AGAIN"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_CANCELLED"
  | "ALREADY_STARTED"
  | "NAME_TAKEN";

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
