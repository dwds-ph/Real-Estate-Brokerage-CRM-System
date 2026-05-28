/**
 * Application-level error types with structured metadata.
 * Enables consistent error handling across services, hooks, and components.
 */

// ─── Error Severity ─────────────────────────────────────────────────────

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

// ─── Error Codes ────────────────────────────────────────────────────────

export const ErrorCode = {
  // Network & Firebase
  NETWORK_ERROR: "NETWORK_ERROR",
  FIRESTORE_READ_FAILED: "FIRESTORE_READ_FAILED",
  FIRESTORE_WRITE_FAILED: "FIRESTORE_WRITE_FAILED",
  FIRESTORE_DELETE_FAILED: "FIRESTORE_DELETE_FAILED",
  AUTH_FAILED: "AUTH_FAILED",
  AUTH_EXPIRED: "AUTH_EXPIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  STORAGE_UPLOAD_FAILED: "STORAGE_UPLOAD_FAILED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Data
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  DATA_CORRUPTION: "DATA_CORRUPTION",

  // Unknown
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── AppError ──────────────────────────────────────────────────────────

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  severity?: ErrorSeverity;
  cause?: unknown;
  context?: Record<string, unknown>;
  recoverable?: boolean;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  override cause?: unknown;
  public readonly context?: Record<string, unknown>;
  public readonly recoverable: boolean;
  public readonly timestamp: number;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.severity = options.severity ?? "medium";
    this.cause = options.cause;
    this.context = options.context;
    this.recoverable = options.recoverable ?? false;
    this.timestamp = Date.now();
  }

  /** Convert to a plain object for logging/storage. */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// ─── Error Factory Functions ─────────────────────────────────────────────

export function createFirestoreError(
  operation: "read" | "write" | "delete",
  cause: unknown,
  context?: Record<string, unknown>,
): AppError {
  const codeMap = {
    read: ErrorCode.FIRESTORE_READ_FAILED,
    write: ErrorCode.FIRESTORE_WRITE_FAILED,
    delete: ErrorCode.FIRESTORE_DELETE_FAILED,
  } as const;

  const messageMap = {
    read: "Failed to read data from the database",
    write: "Failed to save data to the database",
    delete: "Failed to delete data from the database",
  } as const;

  return new AppError({
    code: codeMap[operation],
    message: messageMap[operation],
    severity: "high",
    cause,
    context,
    recoverable: true,
  });
}

export function createAuthError(
  message: string,
  cause?: unknown,
): AppError {
  return new AppError({
    code: ErrorCode.AUTH_FAILED,
    message,
    severity: "high",
    cause,
    recoverable: true,
  });
}

export function createValidationError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError({
    code: ErrorCode.VALIDATION_ERROR,
    message,
    severity: "low",
    context,
    recoverable: true,
  });
}

// ─── Utility to extract message from unknown errors ────────────────────

/**
 * Safely extract an error message from any thrown value.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return "An unknown error occurred";
}
