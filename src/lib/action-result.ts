export type ErrorCode =
  "VALIDATION_ERROR" | "USER_NOT_FOUND" | "INTERNAL_ERROR";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
