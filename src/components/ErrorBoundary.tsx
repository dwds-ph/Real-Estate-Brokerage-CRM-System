import { Component, type ReactNode, type ErrorInfo } from "react";
import { AppError, getErrorMessage } from "@/lib/errors";
import { createScopedLogger } from "@/lib/logger";

const logger = createScopedLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("ErrorBoundary caught an error", {
      error: error instanceof AppError ? error.toJSON() : error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const errorMessage = error ? getErrorMessage(error) : "An unexpected error occurred";

    // If a fallback render prop is provided, use it
    if (typeof this.props.fallback === "function") {
      return this.props.fallback(error!, this.handleRetry);
    }

    // If a fallback ReactNode is provided, use it
    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default error UI
    return (
      <div
        className="flex items-center justify-center min-h-[400px]"
        role="alert"
      >
        <div className="rounded-lg border bg-card p-8 max-w-md text-center space-y-4">
          <span className="text-4xl" aria-hidden="true">
            ⚠️
          </span>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => {
                this.handleRetry();
                window.location.href = "/";
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
