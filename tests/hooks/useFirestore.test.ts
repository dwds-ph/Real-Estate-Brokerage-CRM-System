import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  useCollection,
  useDoc,
  createDoc,
  updateDocById,
  deleteDocById,
} from "@/hooks/useFirestore";

// Mock firebase/firestore
const mockOnSnapshot = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();

vi.mock("firebase/firestore", () => ({
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  DocumentData: class {},
  QueryConstraint: class {},
}));

// Mock @/lib/firebase
vi.mock("@/lib/firebase", () => ({
  db: {},
  storage: {},
}));

// Mock @/context/AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    userProfile: null,
    loading: false,
  })),
}));

describe("useCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return data from collection", async () => {
    const docs = [
      { id: "1", data: () => ({ name: "Alice", age: 30 }) },
      { id: "2", data: () => ({ name: "Bob", age: 25 }) },
    ];

    mockOnSnapshot.mockImplementation((_q, onNext: (snapshot: unknown) => void) => {
      onNext({ docs });
      return vi.fn();
    });

    const { result } = renderHook(() => useCollection("users"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toMatchObject({ id: "1", name: "Alice" });
    expect(result.current.data[1]).toMatchObject({ id: "2", name: "Bob" });
    expect(result.current.error).toBeNull();
  });

  it("should handle loading state", () => {
    mockOnSnapshot.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useCollection("users"));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it("should handle error state", async () => {
    mockOnSnapshot.mockImplementation((_q, _onNext, onError: (err: Error) => void) => {
      onError(new Error("Network error"));
      return vi.fn();
    });

    const { result } = renderHook(() => useCollection("users"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.data).toEqual([]);
  });
});

describe("useDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a single document by id", async () => {
    const snap = {
      exists: () => true,
      id: "doc-1",
      data: () => ({ title: "Test", value: 42 }),
    };

    mockOnSnapshot.mockImplementation((_q, onNext: (snapshot: unknown) => void) => {
      onNext(snap);
      return vi.fn();
    });

    const { result } = renderHook(() => useDoc("items", "doc-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toMatchObject({ id: "doc-1", title: "Test", value: 42 });
    expect(result.current.error).toBeNull();
  });

  it("should handle error for useDoc", async () => {
    mockOnSnapshot.mockImplementation((_q, _onNext, onError: (err: Error) => void) => {
      onError(new Error("Not found"));
      return vi.fn();
    });

    const { result } = renderHook(() => useDoc("items", "doc-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Not found");
    expect(result.current.data).toBeNull();
  });
});

describe("createDoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createDoc should add document with timestamps", async () => {
    mockAddDoc.mockResolvedValue({ id: "new-id" });

    const id = await createDoc("leads", { name: "New Lead", email: "test@test.com" });

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const addedData = mockAddDoc.mock.calls[0][1];
    expect(addedData).toMatchObject({
      name: "New Lead",
      email: "test@test.com",
    });
    expect(addedData.createdAt).toEqual(expect.any(Number));
    expect(addedData.updatedAt).toEqual(expect.any(Number));
    expect(id).toBe("new-id");
  });
});

describe("updateDocById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateDocById should update and set updatedAt", async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    await updateDocById("leads", "lead-1", { status: "contacted" });

    expect(mockUpdateDoc).toHaveBeenCalledOnce();
    const updateData = mockUpdateDoc.mock.calls[0][1];
    expect(updateData).toMatchObject({
      status: "contacted",
    });
    expect(updateData.updatedAt).toEqual(expect.any(Number));
  });
});

describe("deleteDocById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deleteDocById should call deleteDoc", async () => {
    mockDeleteDoc.mockResolvedValue(undefined);

    await deleteDocById("leads", "lead-1");

    expect(mockDeleteDoc).toHaveBeenCalledOnce();
  });
});
