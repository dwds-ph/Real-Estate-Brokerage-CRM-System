import { describe, it, expect } from "vitest";
import {
  AppError,
  ErrorCode,
  createFirestoreError,
  createAuthError,
  createValidationError,
  getErrorMessage,
} from "./errors";

describe("AppError", () => {
  it("creates an error with all properties", () => {
    const error = new AppError({
      code: ErrorCode.NOT_FOUND,
      message: "Document not found",
      severity: "high",
      cause: new Error("underlying"),
      context: { collection: "users", docId: "abc" },
      recoverable: false,
    });

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe("Document not found");
    expect(error.severity).toBe("high");
    expect(error.recoverable).toBe(false);
    expect(error.timestamp).toBeGreaterThan(0);
    expect(error.name).toBe("AppError");
  });

  it("uses defaults for optional fields", () => {
    const error = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Invalid input",
    });

    expect(error.severity).toBe("medium");
    expect(error.recoverable).toBe(false);
    expect(error.cause).toBeUndefined();
    expect(error.context).toBeUndefined();
  });

  it("serializes to JSON", () => {
    const error = new AppError({
      code: ErrorCode.AUTH_FAILED,
      message: "Login failed",
    });

    const json = error.toJSON();
    expect(json.code).toBe(ErrorCode.AUTH_FAILED);
    expect(json.message).toBe("Login failed");
    expect(json.name).toBe("AppError");
  });
});

describe("createFirestoreError", () => {
  it("creates a read error", () => {
    const error = createFirestoreError("read", new Error("timeout"));
    expect(error.code).toBe(ErrorCode.FIRESTORE_READ_FAILED);
    expect(error.recoverable).toBe(true);
    expect(error.severity).toBe("high");
  });

  it("creates a write error", () => {
    const error = createFirestoreError("write", "permission denied", {
      collection: "leads",
    });
    expect(error.code).toBe(ErrorCode.FIRESTORE_WRITE_FAILED);
    expect(error.context?.collection).toBe("leads");
  });

  it("creates a delete error", () => {
    const error = createFirestoreError("delete", "not found");
    expect(error.code).toBe(ErrorCode.FIRESTORE_DELETE_FAILED);
  });
});

describe("createAuthError", () => {
  it("creates an auth error", () => {
    const error = createAuthError("Invalid credentials");
    expect(error.code).toBe(ErrorCode.AUTH_FAILED);
    expect(error.message).toBe("Invalid credentials");
    expect(error.recoverable).toBe(true);
  });
});

describe("createValidationError", () => {
  it("creates a validation error", () => {
    const error = createValidationError("Email is required", {
      field: "email",
    });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.severity).toBe("low");
    expect(error.context?.field).toBe("email");
  });
});

describe("getErrorMessage", () => {
  it("extracts message from AppError", () => {
    const error = new AppError({ code: ErrorCode.NOT_FOUND, message: "Not found" });
    expect(getErrorMessage(error)).toBe("Not found");
  });

  it("extracts message from Error", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe("Something broke");
  });

  it("extracts message from string", () => {
    expect(getErrorMessage("string error")).toBe("string error");
  });

  it("returns fallback for unknown types", () => {
    expect(getErrorMessage(42)).toBe("An unknown error occurred");
  });
});
