import { useState } from "react";
import { License, LicenseType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useFirestore";
import { AppUser } from "@/types";
import { getLicenseTypeLabel } from "@/services/licenseService";
import { createDoc, updateDocById } from "@/hooks/useFirestore";

interface LicenseFormProps {
  license?: License | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function LicenseForm({
  license,
  onSaved,
  onCancel,
}: LicenseFormProps) {
  const { userProfile } = useAuth();
  const { data: users } = useCollection<AppUser>("users", []);

  const agentUsers = users.filter(
    (u) => u.role === "agent" || u.role === "sub-agent" || u.role === "broker",
  ) as AppUser[];

  const isBroker = userProfile?.role === "broker";
  const [saving, setSaving] = useState(false);

  const [agentId, setAgentId] = useState(
    license?.agentId || userProfile?.id || "",
  );
  const [agentName, setAgentName] = useState(
    license?.agentName || userProfile?.displayName || "",
  );
  const [type, setType] = useState<LicenseType>(license?.type || "prc");
  const [licenseNumber, setLicenseNumber] = useState(
    license?.licenseNumber || "",
  );
  const [issuingBody, setIssuingBody] = useState(license?.issuingBody || "");
  const [issueDate, setIssueDate] = useState(
    license ? dateToInput(license.issueDate) : "",
  );
  const [expiryDate, setExpiryDate] = useState(
    license ? dateToInput(license.expiryDate) : "",
  );
  const [notes, setNotes] = useState(license?.notes || "");
  const [documentUrl, setDocumentUrl] = useState(license?.documentUrl || "");

  function dateToInput(ts: number): string {
    return new Date(ts).toISOString().slice(0, 10);
  }

  function handleAgentChange(id: string) {
    setAgentId(id);
    const agent = agentUsers.find((u) => u.id === id);
    if (agent) setAgentName(agent.displayName);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agentId || !licenseNumber || !issueDate || !expiryDate) return;
    setSaving(true);

    try {
      const data = {
        agentId,
        agentName,
        type,
        licenseNumber,
        issuingBody: issuingBody || getLicenseTypeLabel(type),
        issueDate: new Date(issueDate).getTime(),
        expiryDate: new Date(expiryDate).getTime(),
        notes: notes || undefined,
        documentUrl: documentUrl || undefined,
        createdBy: userProfile?.id || "",
      };

      if (license) {
        await updateDocById("licenses", license.id, data);
      } else {
        await createDoc("licenses", data);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  // Auto-set issuing body based on type
  const typeIssuingBodies: Record<LicenseType, string> = {
    prc: "Professional Regulation Commission (PRC)",
    "broker-license":
      "Department of Human Settlements and Urban Development (DHSUD)",
    "bir-accreditation": "Bureau of Internal Revenue (BIR)",
    hlurb: "Housing and Land Use Regulatory Board (HLURB)",
    other: "",
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border bg-card p-6 space-y-4 max-w-lg"
    >
      <h3 className="font-semibold">
        {license ? "Edit License" : "Add License"}
      </h3>

      {isBroker && (
        <div>
          <label
            htmlFor="license-agent"
            className="block text-sm font-medium mb-1"
          >
            Agent
          </label>
          <select
            id="license-agent"
            value={agentId}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Select agent...</option>
            {agentUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.role})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor="license-type"
          className="block text-sm font-medium mb-1"
        >
          License Type *
        </label>
        <select
          id="license-type"
          value={type}
          onChange={(e) => {
            const t = e.target.value as LicenseType;
            setType(t);
            if (!issuingBody || issuingBodiesMatchDefault(type, issuingBody)) {
              setIssuingBody(typeIssuingBodies[t]);
            }
          }}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {(Object.keys(typeIssuingBodies) as LicenseType[]).map((t) => (
            <option key={t} value={t}>
              {getLicenseTypeLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="license-number"
          className="block text-sm font-medium mb-1"
        >
          License Number *
        </label>
        <input
          id="license-number"
          type="text"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="e.g., 0123456"
          required
        />
      </div>

      <div>
        <label
          htmlFor="license-issuer"
          className="block text-sm font-medium mb-1"
        >
          Issuing Body
        </label>
        <input
          id="license-issuer"
          type="text"
          value={issuingBody}
          onChange={(e) => setIssuingBody(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder={typeIssuingBodies[type]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="license-issue-date"
            className="block text-sm font-medium mb-1"
          >
            Issue Date *
          </label>
          <input
            id="license-issue-date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="license-expiry-date"
            className="block text-sm font-medium mb-1"
          >
            Expiry Date *
          </label>
          <input
            id="license-expiry-date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="license-doc-url"
          className="block text-sm font-medium mb-1"
        >
          Document URL (scanned copy)
        </label>
        <input
          id="license-doc-url"
          type="url"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          placeholder="https://storage.googleapis.com/..."
        />
      </div>

      <div>
        <label
          htmlFor="license-notes"
          className="block text-sm font-medium mb-1"
        >
          Notes
        </label>
        <textarea
          id="license-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder="Any remarks about this license..."
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : license ? "Update" : "Add License"}
        </button>
      </div>
    </form>
  );
}

function issuingBodiesMatchDefault(
  currentType: LicenseType,
  currentBody: string,
): boolean {
  const defaults: Record<LicenseType, string> = {
    prc: "Professional Regulation Commission (PRC)",
    "broker-license":
      "Department of Human Settlements and Urban Development (DHSUD)",
    "bir-accreditation": "Bureau of Internal Revenue (BIR)",
    hlurb: "Housing and Land Use Regulatory Board (HLURB)",
    other: "",
  };
  return currentBody === defaults[currentType] || currentBody === "";
}
