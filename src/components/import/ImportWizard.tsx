import { useState, useRef } from "react";
import {
  previewImport,
  importFromCSV,
  LEAD_IMPORT_CONFIG,
  LISTING_IMPORT_CONFIG,
  PROJECT_IMPORT_CONFIG,
  type ImportConfig,
  type ImportResult,
} from "@/lib/csvImport";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────

type Step = "select" | "upload" | "preview" | "importing" | "done";

interface ImportTypeOption {
  config: ImportConfig;
  icon: string;
  label: string;
  description: string;
}

// ─── Import Type Options ────────────────────────────────────────────────

const IMPORT_TYPES: ImportTypeOption[] = [
  { config: LEAD_IMPORT_CONFIG, icon: "👥", label: "Leads", description: "Import buyer/seller leads from a CSV file" },
  { config: LISTING_IMPORT_CONFIG, icon: "🏠", label: "Listings", description: "Import property listings from a CSV file" },
  { config: PROJECT_IMPORT_CONFIG, icon: "🏗️", label: "Projects", description: "Import project/subdivision profiles from a CSV file" },
];

// ─── Helpers ────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateValue(val: unknown, maxLen = 60): string {
  if (val === null || val === undefined) return "—";
  const str = String(val);
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

// ─── Step Components ────────────────────────────────────────────────────

interface StepIndicatorProps {
  steps: { label: string; step: Step }[];
  current: Step;
}

function StepIndicator({ steps, current }: StepIndicatorProps) {
  const currentIdx = steps.findIndex((s) => s.step === current);
  return (
    <nav aria-label="Import steps" className="mb-6">
      <ol className="flex items-center gap-1 sm:gap-2">
        {steps.map((s, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <li key={s.step} className="flex items-center gap-1 sm:gap-2 flex-1 sm:flex-none">
              {i > 0 && (
                <div
                  className={cn(
                    "h-px flex-1 sm:w-8 sm:flex-none",
                    isActive ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    isCurrent
                      ? "bg-primary-foreground text-primary"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function ImportWizard() {
  const [step, setStep] = useState<Step>("select");
  const [selectedConfig, setSelectedConfig] = useState<ImportConfig | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [csvText, setCsvText] = useState<string>("");
  const [preview, setPreview] = useState<{
    headers: string[];
    rows: ReturnType<typeof previewImport>["preview"];
    totalRows: number;
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step data ──────────────────────────────────────────────────────

  const steps: { label: string; step: Step }[] = [
    { label: "Select Type", step: "select" },
    { label: "Upload File", step: "upload" },
    { label: "Preview", step: "preview" },
    { label: "Import", step: "importing" },
    { label: "Done", step: "done" },
  ];

  // ── File handling ─────────────────────────────────────────────────

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file.");
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        setError("The file appears to be empty.");
        return;
      }
      setCsvText(text);

      // Parse preview
      if (selectedConfig) {
        const parsed = previewImport(text, selectedConfig);
        setPreview({
          headers: parsed.headers,
          rows: parsed.preview,
          totalRows: parsed.totalRows,
        });
        setStep("preview");
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  // ── Import execution ──────────────────────────────────────────────

  async function handleImport() {
    if (!selectedConfig || !csvText) return;

    setStep("importing");
    setProgress({ current: 0, total: 0 });

    try {
      const result = await importFromCSV(csvText, selectedConfig, (current, total) => {
        setProgress({ current, total });
      });
      setImportResult(result);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed unexpectedly.");
      setStep("preview");
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────

  function resetAll() {
    setStep("select");
    setSelectedConfig(null);
    setFileName("");
    setFileSize(0);
    setCsvText("");
    setPreview(null);
    setImportResult(null);
    setProgress({ current: 0, total: 0 });
    setDragOver(false);
    setError("");
  }

  // ── Select type handler ───────────────────────────────────────────

  function handleSelectType(config: ImportConfig) {
    setSelectedConfig(config);
    setError("");
    setStep("upload");
  }

  // ── Render: Select Type ───────────────────────────────────────────

  function renderSelect() {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">What do you want to import?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the type of data you'd like to import from a CSV file.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {IMPORT_TYPES.map((item) => {
            const isSelected = selectedConfig?.collectionName === item.config.collectionName;
            return (
              <button
                key={item.config.collectionName}
                type="button"
                onClick={() => handleSelectType(item.config)}
                className={cn(
                  "group relative flex flex-col items-center rounded-xl border-2 bg-card p-6 text-center transition-all",
                  "hover:border-primary/50 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border",
                )}
              >
                <span className="mb-3 text-4xl" aria-hidden="true">
                  {item.icon}
                </span>
                <h3 className="text-base font-semibold text-card-foreground">{item.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                {isSelected && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Expected CSV headers</h4>
          <div className="space-y-3">
            {IMPORT_TYPES.map((item) => (
              <div key={item.config.collectionName} className="text-xs">
                <span className="font-medium text-muted-foreground">{item.icon} {item.label}:</span>
                <code className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground break-all">
                  {item.config.sampleHeaders[0]}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Upload ────────────────────────────────────────────────

  function renderUpload() {
    const selectedType = IMPORT_TYPES.find(
      (t) => t.config.collectionName === selectedConfig?.collectionName,
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Upload CSV File</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Importing: {selectedType?.icon} {selectedType?.label}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("select")}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Change type
          </button>
        </div>

        {/* Expected headers reminder */}
        {selectedConfig && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-foreground mb-1.5">Expected CSV columns:</p>
            <code className="text-[11px] text-muted-foreground break-all">
              {selectedConfig.sampleHeaders[0]}
            </code>
          </div>
        )}

        {/* Drop zone */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all",
            "hover:border-primary/50 hover:bg-muted/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            dragOver
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card",
          )}
        >
          <div className="mb-4 text-5xl opacity-60" aria-hidden="true">
            {dragOver ? "📥" : "📄"}
          </div>
          <p className="text-sm font-medium text-foreground">
            {dragOver ? "Drop your file here" : "Drag & drop your CSV file here"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            Only .csv files accepted
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    );
  }

  // ── Render: Preview ───────────────────────────────────────────────

  function renderPreview() {
    if (!preview || !selectedConfig) return null;

    const allColumns = selectedConfig.columns;
    const hasErrors = preview.rows.some((r) => !r.valid);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Preview & Validate</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Showing first {preview.rows.length} of {preview.totalRows} row{preview.totalRows !== 1 ? "s" : ""}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              hasErrors
                ? "bg-destructive/10 text-destructive"
                : "bg-green-500/10 text-green-600 dark:text-green-400",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                hasErrors ? "bg-destructive" : "bg-green-500",
              )}
              aria-hidden="true"
            />
            {hasErrors
              ? `${preview.rows.filter((r) => !r.valid).length} row${preview.rows.filter((r) => !r.valid).length !== 1 ? "s" : ""} with errors`
              : "All rows valid"}
          </span>
        </div>

        {/* Column mapping info */}
        <details className="rounded-lg border bg-card">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/30 rounded-lg transition-colors">
            Column Mapping ({allColumns.length} fields)
          </summary>
          <div className="border-t px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-1.5 pr-2 font-medium">CSV Column</th>
                  <th className="pb-1.5 pr-2 font-medium">Target Field</th>
                  <th className="pb-1.5 font-medium">Required</th>
                </tr>
              </thead>
              <tbody>
                {allColumns.map((col) => (
                  <tr key={col.targetField} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 text-foreground">{col.sourceLabel}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground font-mono">
                      {col.targetField}
                    </td>
                    <td className="py-1.5">
                      {col.required ? (
                        <span className="text-destructive">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Preview table */}
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                  #
                </th>
                {allColumns.map((col) => (
                  <th
                    key={col.targetField}
                    className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {col.sourceLabel}
                    {col.required && <span className="ml-0.5 text-destructive">*</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={allColumns.length + 1}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    No data rows to display.
                  </td>
                </tr>
              ) : (
                preview.rows.map((row) => {
                  // Map the mapped data back to column order
                  const cells = allColumns.map((col) => row.data[col.targetField]);
                  return (
                    <tr
                      key={row.rowNumber}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        !row.valid
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : "hover:bg-muted/30",
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-card px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {row.rowNumber}
                      </td>
                      {cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className={cn(
                            "px-3 py-2.5 whitespace-nowrap",
                            cell === undefined || cell === "" || cell === null
                              ? "text-muted-foreground/50 italic"
                              : "text-foreground",
                          )}
                          title={cell !== null && cell !== undefined ? String(cell) : undefined}
                        >
                          {truncateValue(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Validation errors */}
        {hasErrors && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="border-b border-destructive/20 px-4 py-2.5">
              <h4 className="text-sm font-semibold text-destructive">
                Validation Errors
              </h4>
            </div>
            <div className="divide-y divide-destructive/10">
              {preview.rows
                .filter((r) => !r.valid)
                .map((row) => (
                  <div key={row.rowNumber} className="px-4 py-2.5">
                    <span className="text-xs font-medium text-destructive">
                      Row {row.rowNumber}:
                    </span>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {row.errors.map((err, ei) => (
                        <li key={ei} className="text-xs text-destructive/80">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("upload")}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Start over
            </button>
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={preview.totalRows === 0}
            className={cn(
              "rounded-lg px-5 py-2 text-sm font-medium transition-colors",
              preview.totalRows === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            Import {preview.totalRows} row{preview.totalRows !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Importing ─────────────────────────────────────────────

  function renderImporting() {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">Importing Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Processing your CSV file, please wait…
          </p>
        </div>

        <div className="mx-auto max-w-md space-y-3">
          {/* Progress bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={progress.current}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-label={`Import progress: ${pct}%`}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {progress.current} of {progress.total} row{progress.total !== 1 ? "s" : ""}
            </span>
            <span className="font-medium">{pct}%</span>
          </div>

          {/* Spinner */}
          <div className="flex justify-center pt-2">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Done ──────────────────────────────────────────────────

  function renderDone() {
    if (!importResult) return null;

    const hasErrors = importResult.errorCount > 0;
    const successPct =
      importResult.totalRows > 0
        ? Math.round((importResult.successCount / importResult.totalRows) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-3 text-5xl" aria-hidden="true">
            {hasErrors ? "⚠️" : "✅"}
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {hasErrors ? "Import Completed With Errors" : "Import Successful"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {importResult.totalRows} row{importResult.totalRows !== 1 ? "s" : ""} processed
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{importResult.totalRows}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Rows</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {importResult.successCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Succeeded</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <p
              className={cn(
                "text-2xl font-bold",
                hasErrors ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {importResult.errorCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Failed</p>
          </div>
        </div>

        {/* Success rate bar */}
        {importResult.totalRows > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Success rate</span>
              <span>{successPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${successPct}%` }}
                role="progressbar"
                aria-valuenow={importResult.successCount}
                aria-valuemin={0}
                aria-valuemax={importResult.totalRows}
                aria-label={`${successPct}% success rate`}
              />
            </div>
          </div>
        )}

        {/* Error details */}
        {hasErrors && importResult.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="border-b border-destructive/20 px-4 py-2.5">
              <h4 className="text-sm font-semibold text-destructive">
                Error Details ({importResult.errors.length})
              </h4>
            </div>
            <div className="max-h-48 divide-y divide-destructive/10 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <div key={i} className="px-4 py-2 text-xs">
                  <span className="font-medium text-destructive">Row {err.row}:</span>{" "}
                  <span className="text-destructive/80">{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={resetAll}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Import Another File
          </button>
          <button
            type="button"
            onClick={() => setStep("preview")}
            className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Back to Preview
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StepIndicator steps={steps} current={step} />

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        {step === "select" && renderSelect()}
        {step === "upload" && renderUpload()}
        {step === "preview" && renderPreview()}
        {step === "importing" && renderImporting()}
        {step === "done" && renderDone()}
      </div>
    </div>
  );
}
