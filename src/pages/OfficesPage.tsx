import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getOffices,
  createOffice,
  updateOffice,
  deleteOffice,
  getOfficeAgents,
} from "@/services/officeService";
import { Office } from "@/types";

export default function OfficesPage() {
  const { userProfile } = useAuth();
  const isBroker = userProfile?.role === "broker";

  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Office agents map
  const [officeAgents, setOfficeAgents] = useState<
    Record<string, { id: string; displayName: string; email: string }[]>
  >({});
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  const loadOffices = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await getOffices(userProfile.id);
      setOffices(data);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to load offices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;
    setSaving(true);
    setError("");
    try {
      if (editId) {
        await updateOffice(editId, { name, address } as Partial<Office>);
      } else {
        await createOffice({ name, address, brokerId: userProfile.id });
      }
      setShowForm(false);
      setEditId(null);
      setName("");
      setAddress("");
      await loadOffices();
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to save office");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (office: Office) => {
    setEditId(office.id);
    setName(office.name);
    setAddress(office.address);
    setShowForm(true);
  };

  const handleDelete = async (officeId: string) => {
    if (!confirm("Are you sure you want to delete this office?")) return;
    try {
      await deleteOffice(officeId);
      await loadOffices();
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setError(fbErr.message || "Failed to delete office");
    }
  };

  const toggleAgents = async (officeId: string) => {
    if (expandedOffice === officeId) {
      setExpandedOffice(null);
      return;
    }
    setExpandedOffice(officeId);
    if (!officeAgents[officeId]) {
      try {
        const agents = await getOfficeAgents(officeId);
        setOfficeAgents((prev) => ({
          ...prev,
          [officeId]: agents.map((a) => ({
            id: a.id as string,
            displayName:
              (a as { displayName: string }).displayName || "Unknown",
            email: (a as { email: string }).email || "",
          })),
        }));
      } catch {
        setOfficeAgents((prev) => ({ ...prev, [officeId]: [] }));
      }
    }
  };

  if (!isBroker) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Offices</h1>
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Only brokers can manage offices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offices</h1>
          <p className="text-muted-foreground">Manage your office locations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setName("");
            setAddress("");
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {showForm ? "Cancel" : "+ Add Office"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border bg-card p-6 space-y-4 max-w-md"
        >
          <h3 className="font-semibold">
            {editId ? "Edit Office" : "New Office"}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              Office Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="Main Office"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="123 Main St, City"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : editId ? "Update Office" : "Create Office"}
          </button>
        </form>
      )}

      {/* Office List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : offices.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No offices yet. Create your first office!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offices.map((office) => (
            <div key={office.id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{office.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {office.address}
                  </p>
                  <button
                    onClick={() => toggleAgents(office.id)}
                    className="text-xs text-primary hover:underline mt-1"
                  >
                    {expandedOffice === office.id
                      ? "Hide agents"
                      : "View agents"}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(office)}
                    className="rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(office.id)}
                    className="rounded-lg border border-destructive/30 px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {expandedOffice === office.id && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Agents in this office
                  </p>
                  {officeAgents[office.id]?.length ? (
                    <div className="space-y-1">
                      {officeAgents[office.id].map((agent) => (
                        <div
                          key={agent.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {agent.displayName.charAt(0).toUpperCase()}
                          </span>
                          <span>{agent.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {agent.email}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No agents assigned to this office.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
