import { useEffect, useRef, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./LoadingSpinner";

// ─── Types ──────────────────────────────────────────────────────────────

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

// ─── Variant Styles ─────────────────────────────────────────────────────

const variantColors: Record<
  ConfirmVariant,
  { icon: string; button: string; iconBg: string }
> = {
  danger: {
    icon: "text-red-600 dark:text-red-400",
    button:
      "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white",
    iconBg:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  warning: {
    icon: "text-amber-600 dark:text-amber-400",
    button:
      "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500 text-white",
    iconBg:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: "text-blue-600 dark:text-blue-400",
    button:
      "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 text-white",
    iconBg:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
};

// ─── Focus Trap Hook ────────────────────────────────────────────────────

function useFocusTrap(containerRef: React.RefObject<HTMLDivElement | null>, active: boolean) {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) {return;}

    // Save the currently focused element so we can restore later
    previouslyFocused.current = document.activeElement as HTMLElement;

    const container = containerRef.current;

    // Focus the first focusable element inside the dialog
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") {return;}

      const focusableElements =
        container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) {return;}

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to the previously focused element
      previouslyFocused.current?.focus();
    };
  }, [active, containerRef]);
}

// ─── Icons ──────────────────────────────────────────────────────────────

function ConfirmIcon({ variant }: { variant: ConfirmVariant }) {
  const colors = variantColors[variant];

  if (variant === "danger") {
    return (
      <div
        className={cn(
          "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
          colors.iconBg,
        )}
      >
        {/* Exclamation triangle */}
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
    );
  }

  if (variant === "warning") {
    return (
      <div
        className={cn(
          "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
          colors.iconBg,
        )}
      >
        {/* Warning triangle */}
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
    );
  }

  // info
  return (
    <div
      className={cn(
        "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
        colors.iconBg,
      )}
    >
      {/* Information circle */}
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    </div>
  );
}

// ─── ConfirmDialog Component ────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  loading: externalLoading,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = "confirm-dialog-title";
  const descriptionId = "confirm-dialog-description";
  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading ?? internalLoading;

  useFocusTrap(dialogRef, open);

  // ── Keyboard handlers ──────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        handleConfirm();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading, onClose],
  );

  // ── Confirm handler with optional async support ────────────────────

  async function handleConfirm() {
    if (isLoading) {return;}
    setInternalLoading(true);
    try {
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  }

  // ── Overlay click ──────────────────────────────────────────────────

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isLoading) {
        onClose();
      }
    },
    [isLoading, onClose],
  );

  // ── Portal - return nothing if closed ──────────────────────────────

  if (!open) {return null;}

  const colors = variantColors[variant];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={handleOverlayClick}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className={cn(
          "relative z-10 mx-auto w-full max-w-md",
          "rounded-xl border shadow-2xl",
          "bg-background text-foreground",
          "border-border",
          "p-6 sm:p-8",
          "transform transition-all duration-200",
          "animate-in fade-in zoom-in-95",
        )}
      >
        {/* Icon */}
        <ConfirmIcon variant={variant} />

        {/* Title */}
        <h2
          id={titleId}
          className="mt-4 text-center text-lg font-semibold leading-6"
        >
          {title}
        </h2>

        {/* Message */}
        <div
          id={descriptionId}
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          {typeof message === "string" ? <p>{message}</p> : message}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className={cn(
              "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium",
              "border border-input bg-background text-foreground",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "transition-colors",
              "sm:w-auto",
            )}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleConfirm}
            className={cn(
              "inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium",
              colors.button,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "transition-colors",
              "sm:w-auto",
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" className="border-current border-t-transparent" />
                {confirmLabel}
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
