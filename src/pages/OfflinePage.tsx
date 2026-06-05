import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OfflinePage() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-redirect back when connectivity restores
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, navigate]);

  if (isOnline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">You're Back Online!</h1>
          <p className="text-muted-foreground mb-6">
            Redirecting you to the dashboard...
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold mb-2">No Internet Connection</h1>
        <p className="text-muted-foreground mb-2">
          You are currently offline. Some features may be unavailable.
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Cached data is still accessible. Changes will sync automatically once
          you're back online.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/60">
          Retrying connection...
          <span className="inline-block ml-1 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        </p>
      </div>
    </div>
  );
}
