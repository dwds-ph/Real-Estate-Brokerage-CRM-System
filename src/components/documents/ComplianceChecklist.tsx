import { cn } from "@/lib/utils";
import { type ComplianceItem } from "@/types";

interface Props {
  items: ComplianceItem[];
  onToggle: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  readOnly?: boolean;
}

const categoryLabels = { legal: "Legal", tax: "Tax", documentary: "Documentary", financial: "Financial" };
const categoryColors = { legal: "border-l-blue-500", tax: "border-l-yellow-500", documentary: "border-l-purple-500", financial: "border-l-green-500" };

export default function ComplianceChecklist({ items, onToggle, onUpdateNotes, readOnly }: Props) {
  const completed = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  const grouped = { legal: items.filter((i) => i.category === "legal"), tax: items.filter((i) => i.category === "tax"), documentary: items.filter((i) => i.category === "documentary"), financial: items.filter((i) => i.category === "financial") };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Compliance Progress</span>
          <span className="text-xs text-muted-foreground">{completed}/{items.length} ({progress}%)</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Grouped Items */}
      {(Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map((cat) => {
        const catItems = grouped[cat];
        if (catItems.length === 0) return null;
        return (
          <div key={cat} className="space-y-1">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{categoryLabels[cat]}</h4>
            {catItems.map((item) => (
              <div key={item.id} className={cn("rounded-lg border bg-card border-l-4 p-3 space-y-1", categoryColors[item.category])}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={item.completed} onChange={() => !readOnly && onToggle(item.id)} disabled={readOnly} className="mt-0.5 h-4 w-4 rounded" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.label}</p>
                      {item.required && <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[9px] text-red-700">Required</span>}
                    </div>
                    {!readOnly && (
                      <input type="text" value={item.notes || ""} onChange={(e) => onUpdateNotes(item.id, e.target.value)} className="mt-1 w-full rounded border bg-background px-2 py-1 text-xs" placeholder="Add notes..." />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
