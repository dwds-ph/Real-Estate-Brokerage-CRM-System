/**
 * CSV Import Service
 *
 * Parses CSV files and imports data into Firestore collections.
 * Supports: leads, listings, projects/units.
 * Client-side only — uses FileReader + text parsing.
 */

import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ───────────────────────────────────────────────────────────

export interface ImportColumn {
  /** Source CSV header */
  sourceLabel: string;
  /** Target Firestore field path (e.g. "location.city") */
  targetField: string;
  /** Whether this field is required */
  required?: boolean;
  /** Default value if empty */
  defaultValue?: string | number;
  /** Transform function */
  transform?: (val: string) => unknown;
}

export interface ImportConfig {
  collectionName: string;
  label: string;
  icon: string;
  description: string;
  columns: ImportColumn[];
  /** Additional fields to always set */
  defaultFields?: Record<string, unknown>;
  /** Max rows per import */
  maxRows?: number;
  /** Sample CSV headers shown to user */
  sampleHeaders: string[];
}

export interface ImportRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
  valid: boolean;
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
  docIds: string[];
}

// ─── CSV Parsing ─────────────────────────────────────────────────────

/**
 * Parse a CSV string into rows. Handles quoted fields, newlines in quotes.
 * Very basic parser — suitable for the simple CSVs agents will upload.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        current.push(field.trim());
        field = "";
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        if (char === "\r") i++;
        current.push(field.trim());
        field = "";
        if (current.length > 0 && current.some((c) => c.length > 0)) {
          rows.push(current);
        }
        current = [];
      } else {
        field += char;
      }
    }
  }

  // Last field
  current.push(field.trim());
  if (current.length > 0 && current.some((c) => c.length > 0)) {
    rows.push(current);
  }

  return rows;
}

// ─── Field Mapping ───────────────────────────────────────────────────

function applyFieldMapping(
  headers: string[],
  row: string[],
  config: ImportConfig,
): ImportRow {
  const result: Record<string, unknown> = { ...config.defaultFields };
  const errors: string[] = [];
  const rowNumber = row[0] === headers[0] ? 0 : 1; // approximate

  // Build header → index map
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h.toLowerCase().trim(), i));

  for (const col of config.columns) {
    const idx = headerMap.get(col.sourceLabel.toLowerCase());
    let value: string | undefined;

    if (idx !== undefined && idx < row.length) {
      value = row[idx];
    }

    // Apply default if empty
    if (!value || value === "") {
      if (col.defaultValue !== undefined) {
        result[col.targetField] = col.defaultValue;
        continue;
      }
      if (col.required) {
        errors.push(`Missing required field: ${col.sourceLabel}`);
      }
      continue;
    }

    // Apply transform
    try {
      result[col.targetField] = col.transform
        ? col.transform(value)
        : value;
    } catch {
      errors.push(`Invalid value for ${col.sourceLabel}: "${value}"`);
    }
  }

  return {
    rowNumber,
    data: result,
    errors,
    valid: errors.length === 0,
  };
}

// ─── Import Execution ────────────────────────────────────────────────

export async function importFromCSV(
  csvText: string,
  config: ImportConfig,
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return {
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      errors: [{ row: 0, message: "CSV must have headers + at least 1 data row" }],
      docIds: [],
    };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const maxRows = config.maxRows ?? 500;
  const limitedRows = dataRows.slice(0, maxRows);

  const result: ImportResult = {
    totalRows: limitedRows.length,
    successCount: 0,
    errorCount: 0,
    errors: [],
    docIds: [],
  };

  const batchSize = 20; // Firestore batch-friendly
  for (let i = 0; i < limitedRows.length; i += batchSize) {
    const batch = limitedRows.slice(i, i + batchSize);
    const promises = batch.map(async (row, batchIdx) => {
      const mapped = applyFieldMapping(headers, row, config);
      if (!mapped.valid) {
        result.errorCount++;
        mapped.errors.forEach((err) =>
          result.errors.push({ row: i + batchIdx + 2, message: err }),
        );
        return;
      }

      try {
        const docRef = await addDoc(
          collection(db, config.collectionName),
          {
            ...mapped.data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        );
        result.successCount++;
        result.docIds.push(docRef.id);
      } catch (err) {
        result.errorCount++;
        result.errors.push({
          row: i + batchIdx + 2,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    });

    await Promise.all(promises);
    onProgress?.(Math.min(i + batchSize, limitedRows.length), limitedRows.length);
  }

  return result;
}

// ─── Preview ─────────────────────────────────────────────────────────

export function previewImport(
  csvText: string,
  config: ImportConfig,
): { headers: string[]; preview: ImportRow[]; totalRows: number } {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return { headers: rows[0] || [], preview: [], totalRows: 0 };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);
  const preview = dataRows.slice(0, 5).map((row, i) => {
    const mapped = applyFieldMapping(headers, row, config);
    return { ...mapped, rowNumber: i + 2 };
  });

  return { headers, preview, totalRows: dataRows.length };
}

// ─── Import Configs ──────────────────────────────────────────────────

export const LEAD_IMPORT_CONFIG: ImportConfig = {
  collectionName: "leads",
  label: "Leads",
  icon: "👥",
  description: "Import buyer/seller leads from a CSV file",
  sampleHeaders: [
    "name,email,phone,source,status,score,propertyInterest,budget,location,notes",
  ],
  columns: [
    { sourceLabel: "name", targetField: "name", required: true },
    { sourceLabel: "email", targetField: "email" },
    { sourceLabel: "phone", targetField: "phone" },
    {
      sourceLabel: "source",
      targetField: "source",
      defaultValue: "manual",
    },
    {
      sourceLabel: "status",
      targetField: "status",
      defaultValue: "new",
    },
    {
      sourceLabel: "score",
      targetField: "score",
      defaultValue: "warm",
    },
    { sourceLabel: "propertyInterest", targetField: "propertyInterest" },
    {
      sourceLabel: "budget",
      targetField: "budget",
      transform: (v) => Number(v.replace(/[^0-9.]/g, "")) || 0,
    },
    { sourceLabel: "location", targetField: "location" },
    { sourceLabel: "notes", targetField: "notes" },
  ],
  defaultFields: {
    communicationLog: [],
    activityTimeline: [],
  },
};

export const LISTING_IMPORT_CONFIG: ImportConfig = {
  collectionName: "listings",
  label: "Listings",
  icon: "🏠",
  description: "Import property listings from a CSV file",
  sampleHeaders: [
    "title,description,price,address,city,province,propertyType,bedrooms,bathrooms,lotArea,floorArea,status,amenities",
  ],
  columns: [
    { sourceLabel: "title", targetField: "title", required: true },
    { sourceLabel: "description", targetField: "description" },
    {
      sourceLabel: "price",
      targetField: "price",
      required: true,
      transform: (v) => Number(v.replace(/[^0-9.]/g, "")) || 0,
    },
    { sourceLabel: "address", targetField: "location.address" },
    { sourceLabel: "city", targetField: "location.city" },
    { sourceLabel: "province", targetField: "location.province" },
    {
      sourceLabel: "propertyType",
      targetField: "propertyType",
      defaultValue: "house-lot",
    },
    {
      sourceLabel: "bedrooms",
      targetField: "propertyDetails.bedrooms",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "bathrooms",
      targetField: "propertyDetails.bathrooms",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "lotArea",
      targetField: "propertyDetails.lotArea",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "floorArea",
      targetField: "propertyDetails.floorArea",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "status",
      targetField: "status",
      defaultValue: "available",
    },
    {
      sourceLabel: "amenities",
      targetField: "amenities",
      transform: (v) => v.split(";").map((a) => a.trim()).filter(Boolean),
    },
  ],
  defaultFields: {
    media: [],
    views: 0,
    inquiries: 0,
    floodRisk: "unknown",
  },
};

export const PROJECT_IMPORT_CONFIG: ImportConfig = {
  collectionName: "projects",
  label: "Projects",
  icon: "🏗️",
  description: "Import project/subdivision profiles from a CSV file",
  sampleHeaders: [
    "name,developer,address,city,province,description,projectType,totalUnits,availableUnits,priceMin,priceMax,status",
  ],
  columns: [
    { sourceLabel: "name", targetField: "name", required: true },
    { sourceLabel: "developer", targetField: "developer", required: true },
    { sourceLabel: "address", targetField: "location.address" },
    { sourceLabel: "city", targetField: "location.city" },
    { sourceLabel: "province", targetField: "location.province" },
    { sourceLabel: "description", targetField: "description" },
    {
      sourceLabel: "projectType",
      targetField: "projectType",
      defaultValue: "subdivision",
    },
    {
      sourceLabel: "totalUnits",
      targetField: "totalUnits",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "availableUnits",
      targetField: "availableUnits",
      transform: (v) => Number(v) || 0,
    },
    {
      sourceLabel: "priceMin",
      targetField: "priceRange.min",
      transform: (v) => Number(v.replace(/[^0-9.]/g, "")) || 0,
    },
    {
      sourceLabel: "priceMax",
      targetField: "priceRange.max",
      transform: (v) => Number(v.replace(/[^0-9.]/g, "")) || 0,
    },
    {
      sourceLabel: "status",
      targetField: "status",
      defaultValue: "pre-selling",
    },
  ],
  defaultFields: {
    phases: [],
    amenities: [],
    media: [],
    assignedTo: [],
  },
};
