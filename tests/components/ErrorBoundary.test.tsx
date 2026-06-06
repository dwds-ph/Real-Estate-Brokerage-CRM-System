import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Mock i18n for ErrorBoundary (uses i18n.t() directly, not useTranslation())
vi.mock("@/lib/i18n", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "errors.generic": "Something went wrong",
        "errorPage.title": "An unexpected error occurred",
        "common.retry": "Try Again",
        "errorPage.goHome": "Go to Dashboard",
      };
      return translations[key] || key;
    },
    language: "en",
    changeLanguage: vi.fn(),
  },
}));

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children when no error", () => {
    render(
      <ErrorBoundary>
        <div>Safe content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("should show error UI when error thrown", () => {
    const ThrowingComponent = () => {
      throw new Error("Test crash");
    };

    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test crash")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to dashboard/i }),
    ).toBeInTheDocument();
  });

  it("should render custom fallback when provided", () => {
    const ThrowingComponent = () => {
      throw new Error("Test crash");
    };

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
  });
});
