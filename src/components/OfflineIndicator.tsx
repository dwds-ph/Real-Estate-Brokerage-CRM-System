import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-lg">
        📡 You are offline — changes will sync when reconnected
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 px-4 py-2 text-center text-sm font-medium text-white shadow-lg transition-opacity duration-1000">
        ✅ Back online — data synced
      </div>
    );
  }

  return null;
}
