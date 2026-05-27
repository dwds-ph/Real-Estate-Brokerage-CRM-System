import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFcmService } from "@/services/fcm";

// Mock firebase/messaging
const mockGetMessaging = vi.fn(() => ({}));
const mockGetToken = vi.fn();
let messageHandler: ((payload: unknown) => void) | null = null;

vi.mock("firebase/messaging", () => ({
  getMessaging: (...args: unknown[]) => mockGetMessaging(...args),
  getToken: (...args: unknown[]) => mockGetToken(...args),
  onMessage: (...args: unknown[]) => {
    if (typeof args[1] === "function") {
      messageHandler = args[1] as (payload: unknown) => void;
    }
  },
}));

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, _coll: string, id: string) => ({ id })),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn((...args: unknown[]) => args),
}));

// Mock @/context/AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock @/services/notifications
vi.mock("@/services/notifications", () => ({
  createNotification: vi.fn(() => Promise.resolve("notif-id")),
}));

const { useAuth } = await import("@/context/AuthContext");
const { updateDoc } = await import("firebase/firestore");
const { createNotification } = await import("@/services/notifications");

describe("useFcmService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messageHandler = null;
    // Reset Notification permission mock
    Object.defineProperty(globalThis, "Notification", {
      value: { requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  it("should not initialize if user is not logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      userProfile: null,
    });

    renderHook(() => useFcmService());

    expect(mockGetMessaging).not.toHaveBeenCalled();
    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it("should not initialize if userProfile is missing", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: null,
    });

    renderHook(() => useFcmService());

    expect(mockGetMessaging).not.toHaveBeenCalled();
  });

  it("should request notification permission and register FCM token", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    mockGetToken.mockResolvedValue("fcm-token-abc123");

    renderHook(() => useFcmService());

    await vi.waitFor(() => {
      expect(mockGetMessaging).toHaveBeenCalled();
      expect(Notification.requestPermission).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();
    });
  });

  it("should store FCM token on user document", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    mockGetToken.mockResolvedValue("fcm-token-abc123");

    renderHook(() => useFcmService());

    await vi.waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "user-1" }),
        expect.objectContaining({
          fcmTokens: expect.arrayContaining(["fcm-token-abc123"]),
        }),
      );
    });
  });

  it("should not proceed if notification permission is denied", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("denied");

    renderHook(() => useFcmService());

    await vi.waitFor(() => {
      expect(mockGetToken).not.toHaveBeenCalled();
    });
  });

  it("should handle FCM init errors gracefully", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    mockGetToken.mockRejectedValue(new Error("FCM unavailable"));

    expect(() => renderHook(() => useFcmService())).not.toThrow();
  });

  it("should register listener for foreground messages", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    mockGetToken.mockResolvedValue("fcm-token-abc123");

    renderHook(() => useFcmService());

    // First wait for getToken (which runs before onMessage)
    await vi.waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
    });

    // Then check that messageHandler was set (proves onMessage was called)
    expect(messageHandler).not.toBeNull();
  });

  it("should create notification when foreground message arrives", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: "user-1" },
      userProfile: { displayName: "Test User" },
    });
    vi.mocked(Notification.requestPermission).mockResolvedValue("granted");
    mockGetToken.mockResolvedValue("fcm-token-abc123");

    renderHook(() => useFcmService());

    await vi.waitFor(() => {
      expect(messageHandler).not.toBeNull();
    });

    // Simulate a foreground message using the captured handler
    messageHandler!({
      notification: {
        title: "New Lead",
        body: "A new lead has arrived",
      },
    });

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        title: "New Lead",
        body: "A new lead has arrived",
      }),
    );
  });
});
