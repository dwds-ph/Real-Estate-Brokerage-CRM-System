import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseCSV,
  previewImport,
  importFromCSV,
  LEAD_IMPORT_CONFIG,
  LISTING_IMPORT_CONFIG,
  PROJECT_IMPORT_CONFIG,
  type ImportConfig,
} from "@/lib/csvImport";

// Mock firebase/firestore
const mockAddDoc = vi.fn();
vi.mock("firebase/firestore", () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: vi.fn(() => "collection-ref"),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAddDoc.mockResolvedValue({ id: "mock-doc-id" });
});

// ─── parseCSV ───────────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("parses simple CSV with headers and rows", () => {
    const csv =
      "name,email,phone\nAlice,alice@test.com,123\nBob,bob@test.com,456";
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["name", "email", "phone"],
      ["Alice", "alice@test.com", "123"],
      ["Bob", "bob@test.com", "456"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    const csv =
      'name,description\nAlice,"has a cat, dog, and fish"\nBob,"simple"';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["name", "description"],
      ["Alice", "has a cat, dog, and fish"],
      ["Bob", "simple"],
    ]);
  });

  it("handles quoted fields with newlines", () => {
    const csv = 'name,notes\nAlice,"line1\nline2"\nBob,"single"';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["name", "notes"],
      ["Alice", "line1\nline2"],
      ["Bob", "single"],
    ]);
  });

  it("handles escaped quotes inside quoted fields", () => {
    const csv = 'name,quote\nAlice,"She said ""hello"""\nBob,"He said ""hi"""';
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["name", "quote"],
      ["Alice", 'She said "hello"'],
      ["Bob", 'He said "hi"'],
    ]);
  });

  it("handles CRLF line endings", () => {
    const csv = "a,b\r\n1,2\r\n3,4";
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("trims whitespace from fields", () => {
    const csv = "name, email , phone\n Alice , alice@test.com , 123 ";
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["name", "email", "phone"],
      ["Alice", "alice@test.com", "123"],
    ]);
  });

  it("skips empty rows", () => {
    const csv = "a,b\n1,2\n\n3,4\n\n";
    const result = parseCSV(csv);
    expect(result).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("handles single field CSV", () => {
    const csv = "name\nAlice\nBob";
    const result = parseCSV(csv);
    expect(result).toEqual([["name"], ["Alice"], ["Bob"]]);
  });

  it("handles empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("handles header-only CSV", () => {
    const csv = "name,email";
    const result = parseCSV(csv);
    expect(result).toEqual([["name", "email"]]);
  });
});

// ─── previewImport ──────────────────────────────────────────────────────

describe("previewImport", () => {
  it("returns empty result for empty CSV", () => {
    const result = previewImport("", LEAD_IMPORT_CONFIG);
    expect(result.headers).toEqual([]);
    expect(result.preview).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });

  it("returns empty result for header-only CSV", () => {
    const result = previewImport("name,email", LEAD_IMPORT_CONFIG);
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.preview).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });

  it("previews up to 5 rows with mapped data", () => {
    const csv =
      "name,email,phone\nAlice,alice@test.com,123\nBob,bob@test.com,456\nCharlie,charlie@test.com,789";
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    expect(result.headers).toEqual(["name", "email", "phone"]);
    expect(result.totalRows).toBe(3);
    expect(result.preview).toHaveLength(3);
    expect(result.preview[0]).toMatchObject({
      rowNumber: 2,
      valid: true,
      errors: [],
    });
    expect(result.preview[0].data).toMatchObject({
      name: "Alice",
      email: "alice@test.com",
      phone: "123",
      source: "manual", // default value
      status: "new", // default value
      score: "warm", // default value
    });
  });

  it("applies default values for empty fields", () => {
    const csv = "name\nAlice\n";
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    expect(result.preview[0].data).toMatchObject({
      name: "Alice",
      source: "manual",
      status: "new",
      score: "warm",
    });
  });

  it("flags missing required fields", () => {
    const csv = "email\nno-name@test.com\n";
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    expect(result.preview[0].valid).toBe(false);
    expect(result.preview[0].errors).toContain("Missing required field: name");
  });

  it("applies budget transform (strips non-numeric)", () => {
    const csv = 'name,budget\nAlice,"₱5,000,000"\nBob,"1.5M"\n';
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    // "₱5,000,000" after removing /[^0-9.]/g => "5000000"
    expect(result.preview[0].data.budget).toBe(5000000);
    // "1.5M" after removing /[^0-9.]/g => "1.5" => Number => 1.5 => ||0 => 1.5
    expect(result.preview[1].data.budget).toBe(1.5);
  });

  it("applies amenities split transform for listing config", () => {
    const csv = "title,amenities\nUnit A,pool;gym;parking\nUnit B,none";
    const result = previewImport(csv, LISTING_IMPORT_CONFIG);
    expect(result.preview[0].data.amenities).toEqual([
      "pool",
      "gym",
      "parking",
    ]);
    expect(result.preview[1].data.amenities).toEqual(["none"]);
  });

  it("applies numeric transform for bedrooms/bathrooms", () => {
    const csv = "title,bedrooms,bathrooms\nUnit A,3,2\nUnit B,4,3";
    const result = previewImport(csv, LISTING_IMPORT_CONFIG);
    expect(result.preview[0].data).toMatchObject({
      "propertyDetails.bedrooms": 3,
      "propertyDetails.bathrooms": 2,
    });
  });

  it("applies price transform for listing price", () => {
    const csv = 'title,price\nUnit A,"₱2,500,000"\n';
    const result = previewImport(csv, LISTING_IMPORT_CONFIG);
    expect(result.preview[0].data.price).toBe(2500000);
  });

  it("applies priceRange transforms for project config", () => {
    const csv = "name,developer,priceMin,priceMax\nProj A,Dev Co,₱1M,₱5M\n";
    const result = previewImport(csv, PROJECT_IMPORT_CONFIG);
    expect(result.preview[0].data).toMatchObject({
      "priceRange.min": 1,
      "priceRange.max": 5,
    });
  });

  it("applies defaultFields from config", () => {
    const csv = "name\nAlice\n";
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    expect(result.preview[0].data).toMatchObject({
      communicationLog: [],
      activityTimeline: [],
    });
  });

  it("preview does NOT exceed 5 data rows", () => {
    const csv = "name\nA1\nA2\nA3\nA4\nA5\nA6\nA7\nA8\nA9\nA10\n";
    const result = previewImport(csv, LEAD_IMPORT_CONFIG);
    expect(result.preview).toHaveLength(5);
    expect(result.totalRows).toBe(10);
  });
});

// ─── importFromCSV ──────────────────────────────────────────────────────

describe("importFromCSV", () => {
  it("returns error when CSV has no data rows", async () => {
    const result = await importFromCSV("name,email", LEAD_IMPORT_CONFIG);
    expect(result.totalRows).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("must have headers");
  });

  it("imports rows successfully with addDoc", async () => {
    const csv =
      "name,email,phone\nAlice,alice@test.com,123\nBob,bob@test.com,456";
    const result = await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(result.totalRows).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.docIds).toEqual(["mock-doc-id", "mock-doc-id"]);
    expect(mockAddDoc).toHaveBeenCalledTimes(2);
  });

  it("passes defaultFields and timestamps to addDoc", async () => {
    const csv = "name\nAlice\n";
    await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(mockAddDoc).toHaveBeenCalledWith(
      "collection-ref",
      expect.objectContaining({
        name: "Alice",
        communicationLog: [],
        activityTimeline: [],
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }),
    );
  });

  it("tracks errors from invalid rows", async () => {
    const csv = "email\nno-name@test.com\n";
    const result = await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(result.errorCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("Missing required field: name");
  });

  it("tracks errors from addDoc failures", async () => {
    mockAddDoc.mockRejectedValue(new Error("Firestore write failed"));
    const csv = "name\nAlice\n";
    const result = await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(result.errorCount).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe("Firestore write failed");
  });

  it("limits rows to maxRows config (default 500)", async () => {
    const header = "name\n";
    const rows = Array.from({ length: 600 }, (_, i) => `User${i + 1}`);
    const csv = header + rows.join("\n");
    const result = await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(result.totalRows).toBe(500);
    expect(result.successCount).toBe(500);
  });

  it("respects custom maxRows from config", async () => {
    const config: ImportConfig = {
      ...LEAD_IMPORT_CONFIG,
      maxRows: 10,
    };
    const header = "name\n";
    const rows = Array.from({ length: 50 }, (_, i) => `User${i + 1}`);
    const csv = header + rows.join("\n");
    const result = await importFromCSV(csv, config);
    expect(result.totalRows).toBe(10);
    expect(result.successCount).toBe(10);
  });

  it("calls onProgress callback with current/total", async () => {
    const onProgress = vi.fn();
    const csv = "name\nA1\nA2\nA3\nA4\nA5\n";
    await importFromCSV(csv, LEAD_IMPORT_CONFIG, onProgress);
    expect(onProgress).toHaveBeenCalledTimes(1);
    // batch starts at 0, adds batchSize=20, capped at 5 total rows
    expect(onProgress).toHaveBeenCalledWith(5, 5);
  });

  it("processes rows in batches of 20", async () => {
    const csv =
      "name\n" +
      Array.from({ length: 25 }, (_, i) => `User${i + 1}`).join("\n");
    await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    // addDoc should have been called 25 times
    expect(mockAddDoc).toHaveBeenCalledTimes(25);
  });

  it("handles empty string values correctly (no error for optional)", async () => {
    const csv = "name,email\nAlice,\nBob,bob@test.com\n";
    const result = await importFromCSV(csv, LEAD_IMPORT_CONFIG);
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(0);
  });
});

// ─── Import Configs ─────────────────────────────────────────────────────

describe("LEAD_IMPORT_CONFIG", () => {
  it("has required name column", () => {
    const nameCol = LEAD_IMPORT_CONFIG.columns.find(
      (c) => c.sourceLabel === "name",
    );
    expect(nameCol?.required).toBe(true);
  });

  it("has sampleHeaders", () => {
    expect(LEAD_IMPORT_CONFIG.sampleHeaders).toHaveLength(1);
    expect(LEAD_IMPORT_CONFIG.sampleHeaders[0]).toContain("name");
  });

  it("defaults maxRows to undefined (uses 500 in code)", () => {
    expect(LEAD_IMPORT_CONFIG.maxRows).toBeUndefined();
  });
});

describe("LISTING_IMPORT_CONFIG", () => {
  it("has required title and price columns", () => {
    const titleCol = LISTING_IMPORT_CONFIG.columns.find(
      (c) => c.sourceLabel === "title",
    );
    const priceCol = LISTING_IMPORT_CONFIG.columns.find(
      (c) => c.sourceLabel === "price",
    );
    expect(titleCol?.required).toBe(true);
    expect(priceCol?.required).toBe(true);
  });

  it("has defaultFields for media, views, inquiries, floodRisk", () => {
    expect(LISTING_IMPORT_CONFIG.defaultFields).toMatchObject({
      media: [],
      views: 0,
      inquiries: 0,
      floodRisk: "unknown",
    });
  });
});

describe("PROJECT_IMPORT_CONFIG", () => {
  it("has required name and developer columns", () => {
    const nameCol = PROJECT_IMPORT_CONFIG.columns.find(
      (c) => c.sourceLabel === "name",
    );
    const devCol = PROJECT_IMPORT_CONFIG.columns.find(
      (c) => c.sourceLabel === "developer",
    );
    expect(nameCol?.required).toBe(true);
    expect(devCol?.required).toBe(true);
  });

  it("has correct defaultFields", () => {
    expect(PROJECT_IMPORT_CONFIG.defaultFields).toMatchObject({
      phases: [],
      amenities: [],
      media: [],
      assignedTo: [],
    });
  });
});
