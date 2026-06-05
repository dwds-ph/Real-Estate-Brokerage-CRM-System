/**
 * ReportExport.tsx — CSV and PDF export utilities for report data.
 *
 * Leverages jspdf + jspdf-autotable (already installed) for PDF generation
 * and a pure-JS Blob-based approach for CSV.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportRow } from "@/lib/reportEngine";

// ─── CSV Export ─────────────────────────────────────────────────────────

/**
 * Generate a CSV string from report rows and trigger a browser download.
 *
 * @param rows     The ReportRow array to export.
 * @param filename Name for the downloaded file (without extension).
 */
export function exportToCSV(rows: ReportRow[], filename: string): void {
  // Headers
  const headers = ["Label", "Count", "Value"];

  // Collect all detail keys across rows
  const detailKeys = new Set<string>();
  for (const row of rows) {
    if (row.details) {
      for (const key of Object.keys(row.details)) {
        detailKeys.add(key);
      }
    }
  }
  const detailHeaders = Array.from(detailKeys);
  const allHeaders = [...headers, ...detailHeaders];

  // Build CSV lines
  const lines: string[] = [allHeaders.map(escapeCsvField).join(",")];
  for (const row of rows) {
    const base = [
      String(row.label),
      String(row.count),
      String(row.value),
    ];
    const details = detailHeaders.map((k) =>
      row.details ? String(row.details[k] ?? "") : "",
    );
    lines.push([...base, ...details].map(escapeCsvField).join(","));
  }

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Escape a CSV field (wrap in quotes if it contains comma, newline, or quote). */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── PDF Export ─────────────────────────────────────────────────────────

/**
 * Generate a PDF document from report rows and trigger a browser download.
 *
 * @param title   Report title (appears in the PDF header).
 * @param rows    The ReportRow array to render as a table.
 * @param summary Summary items to display above the table.
 */
export function exportToPDF(
  title: string,
  rows: ReportRow[],
  summary: { label: string; value: string | number }[],
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Generated timestamp
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 27);

  // Summary block
  let yCursor = 35;
  doc.setFontSize(11);

  if (summary.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, yCursor);
    yCursor += 6;
    doc.setFont("helvetica", "normal");

    const summaryLines: string[] = summary.map(
      (s) => `${s.label}: ${s.value}`,
    );
    for (const line of summaryLines) {
      if (yCursor > 270) {
        doc.addPage();
        yCursor = 20;
      }
      doc.text(line, 18, yCursor);
      yCursor += 5;
    }
    yCursor += 6;
  }

  // Build auto-table columns and rows
  const detailKeys = new Set<string>();
  for (const row of rows) {
    if (row.details) {
      for (const key of Object.keys(row.details)) {
        detailKeys.add(key);
      }
    }
  }
  const detailHeaders = Array.from(detailKeys);

  const columns = [
    { header: "Label", dataKey: "label" },
    { header: "Count", dataKey: "count" },
    { header: "Value", dataKey: "value" },
    ...detailHeaders.map((k) => ({ header: k, dataKey: k })),
  ];

  const body = rows.map((row) => {
    const base: Record<string, string | number> = {
      label: row.label,
      count: row.count,
      value: row.value,
    };
    for (const key of detailHeaders) {
      base[key] = row.details?.[key] ?? "";
    }
    return base;
  });

  // Ensure we haven't gone past bottom margin; add a new page if needed
  if (yCursor > 260) {
    doc.addPage();
    yCursor = 20;
  }

  autoTable(doc, {
    startY: yCursor,
    columns,
    body,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    margin: { top: 10 },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}
