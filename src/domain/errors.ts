export type ErrorCode =
  | "VALIDATION_ERROR"
  | "USER_NOT_FOUND"
  | "INTERNAL_ERROR"
  | "INVALID_RANGE"
  | "IN_THE_PAST"
  | "DURATION_TOO_SHORT"
  | "DURATION_TOO_LONG";

export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
