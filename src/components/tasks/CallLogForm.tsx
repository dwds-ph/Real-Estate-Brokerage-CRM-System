import { useState } from "react";

interface CallLogFormProps {
  contacts: { id: string; name: string; phone?: string }[];
  onSubmit: (data: {
    contactName: string;
    contactPhone?: string;
    duration: number;
    notes: string;
    followUpDate: string;
  }) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export default function CallLogForm({
  contacts,
  onSubmit,
  onCancel,
  saving,
}: CallLogFormProps) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [duration, setDuration] = useState(5);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const handleContactChange = (value: string) => {
    setContactName(value);
    const contact = contacts.find((c) => c.name === value);
    if (contact?.phone) setContactPhone(contact.phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName) return;
    await onSubmit({
      contactName,
      contactPhone: contactPhone || undefined,
      duration,
      notes,
      followUpDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="call-contact"
          className="block text-sm font-medium mb-1"
        >
          Contact *
        </label>
        {contacts.length > 0 ? (
          <select
            id="call-contact"
            value={contactName}
            onChange={(e) => handleContactChange(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Select a contact...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="call-contact"
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Contact name..."
            required
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="call-phone"
            className="block text-sm font-medium mb-1"
          >
            Phone
          </label>
          <input
            id="call-phone"
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="Optional"
          />
        </div>
        <div>
          <label
            htmlFor="call-duration"
            className="block text-sm font-medium mb-1"
          >
            Duration (min)
          </label>
          <input
            id="call-duration"
            type="number"
            value={duration}
            onChange={(e) =>
              setDuration(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            min={1}
          />
        </div>
      </div>

      <div>
        <label htmlFor="call-notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="call-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={2}
          placeholder="Call summary..."
        />
      </div>

      <div>
        <label
          htmlFor="call-followup"
          className="block text-sm font-medium mb-1"
        >
          Follow-up Date
        </label>
        <input
          id="call-followup"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Log Call"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
