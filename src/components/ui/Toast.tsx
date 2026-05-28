/* eslint-disable react-refresh/only-export-components */
import { useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Toast Types ────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toast: Toast) => void;

// ─── Pub/sub system (no external deps) ──────────────────────────────

let listeners: ToastListener[] = [];
let toastCounter = 0;

export function subscribeToasts(listener: ToastListener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function toast(type: Toast["type"], title: string, message?: string) {
  const t: Toast = {
    id: `toast-${++toastCounter}`,
    type,
    title,
    message,
    duration: type === "error" ? 6000 : 4000,
  };
  listeners.forEach((l) => l(t));
}

// ─── Toast Container Component ──────────────────────────────────────

function ToastIcon({ type }: { type: Toast["type"] }) {
  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };
  return <span className="text-lg shrink-0">{icons[type]}</span>;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const borderColors = {
    success: "border-l-green-500",
    error: "border-l-red-500",
    info: "border-l-blue-500",
    warning: "border-l-yellow-500",
  };

  useEffect(() => {
    if (!toast.duration) {return;}
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-4 shadow-lg",
        "border-l-4 animate-in slide-in-from-right-2",
        borderColors[toast.type],
      )}
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsub = subscribeToasts((t) => {
      setToasts((prev) => [...prev, t]);
    });
    return unsub;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) {return null;}

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
