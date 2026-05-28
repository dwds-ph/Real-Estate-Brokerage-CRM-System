import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeMap = {
  sm: "h-5 w-5 border-2",
  md: "h-10 w-10 border-3",
  lg: "h-16 w-16 border-4",
};

export function LoadingSpinner({
  size = "md",
  className,
  message,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizeMap[size],
        )}
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
