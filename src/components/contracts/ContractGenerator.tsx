import { useState, useMemo } from "react";
import {
  CONTRACT_TEMPLATES,
  getFieldsForTemplate,
  autoFillFromDeal,
} from "@/lib/contracts";
import type { ContractTemplateId, ContractData } from "@/lib/contracts";
import { formatCurrency } from "@/lib/utils";
import { generateContract } from "@/lib/contracts/generator";

interface ContractGeneratorProps {
  open: boolean;
  onClose: () => void;
  deal?: {
    clientName: string;
    dealPrice: number;
    clientContact: string;
  };
  listing?: {
    title: string;
    price: number;
    location: { address: string; city: string; province?: string };
    propertyType: string;
    propertyDetails?: { lotArea?: number; floorArea?: number };
  } | null;
}

export function ContractGenerator({
  open,
  onClose,
  deal,
  listing,
}: ContractGeneratorProps) {
  const [step, setStep] = useState<"select" | "fill" | "preview">("select");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplateId | null>(null);
  const [formData, setFormData] = useState<Partial<ContractData>>({});

  const autoFilled = useMemo(() => {
    return autoFillFromDeal(
      deal || { clientName: "", dealPrice: 0, clientContact: "" },
      listing,
    );
  }, [deal, listing]);

  const handleSelectTemplate = (templateId: ContractTemplateId) => {
    setSelectedTemplate(templateId);
    setFormData(autoFilled);
    setStep("fill");
  };

  const handleFieldChange = (key: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    setStep("preview");
  };

  const handleDownload = () => {
    if (!selectedTemplate) return;
    const doc = generateContract(selectedTemplate, formData as ContractData);
    const template = CONTRACT_TEMPLATES.find((t) => t.id === selectedTemplate);
    doc.save(
      `${template?.name.replace(/\s+/g, "_")}_${formData.buyerName || "Client"}.pdf`.replace(
        /[^a-zA-Z0-9_.]/g,
        "_",
      ),
    );
  };

  const handleBack = () => {
    if (step === "fill") {
      setStep("select");
      setSelectedTemplate(null);
    } else if (step === "preview") {
      setStep("fill");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step !== "select" && (
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ←
              </button>
            )}
            <h3 className="text-lg font-semibold">
              {step === "select"
                ? "Generate Contract"
                : step === "fill"
                  ? "Fill Contract Details"
                  : "Preview Contract"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step 1: Select Template */}
        {step === "select" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a document template to generate:
            </p>
            {CONTRACT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className="w-full text-left rounded-lg border p-4 hover:bg-muted/50 hover:border-primary transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {template.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    {template.lawReference && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        ⚖ {template.lawReference}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Fill Fields */}
        {step === "fill" && selectedTemplate && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fields are pre-filled from deal/listing data. Edit as needed.
            </p>
            {(() => {
              const fields = getFieldsForTemplate(selectedTemplate);
              const sections = [
                { key: "parties", label: "Parties" },
                { key: "property", label: "Property" },
                { key: "financial", label: "Financial" },
                { key: "dates", label: "Dates" },
                { key: "other", label: "Signatories" },
              ] as const;

              return sections.map(
                (section) =>
                  fields.filter((f) => f.section === section.key).length >
                    0 && (
                    <div key={section.key}>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                        {section.label}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fields
                          .filter((f) => f.section === section.key)
                          .map((field) => (
                            <div key={field.key}>
                              <label className="text-xs font-medium">
                                {field.label}
                                {field.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </label>
                              {field.type === "select" ? (
                                <select
                                  value={
                                    (formData[
                                      field.key as keyof ContractData
                                    ] as string) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  required={field.required}
                                >
                                  <option value="">Select...</option>
                                  {field.options?.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === "date" ? (
                                <input
                                  type="date"
                                  value={
                                    (formData[
                                      field.key as keyof ContractData
                                    ] as string) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(field.key, e.target.value)
                                  }
                                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  required={field.required}
                                />
                              ) : (
                                <input
                                  type={
                                    field.type === "number" ? "number" : "text"
                                  }
                                  value={
                                    (formData[
                                      field.key as keyof ContractData
                                    ] as string | number) || ""
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      field.key,
                                      field.type === "number"
                                        ? Number(e.target.value)
                                        : e.target.value,
                                    )
                                  }
                                  placeholder={field.placeholder}
                                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                                  required={field.required}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ),
              );
            })()}

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Preview & Download
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your contract is ready. Review the summary below and download.
            </p>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template:</span>
                <span className="font-medium">
                  {CONTRACT_TEMPLATES.find((t) => t.id === selectedTemplate)
                    ?.name || selectedTemplate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Buyer:</span>
                <span className="font-medium">{formData.buyerName}</span>
              </div>
              {formData.sellerName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller:</span>
                  <span className="font-medium">{formData.sellerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-medium truncate max-w-[200px]">
                  {formData.propertyTitle}
                </span>
              </div>
              {formData.purchasePrice != null && formData.purchasePrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {formatCurrency(formData.purchasePrice ?? 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{formData.dateOfAgreement}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("fill")}
                className="flex-1 rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                ← Edit
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                ⬇ Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
