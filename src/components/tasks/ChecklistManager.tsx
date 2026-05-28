import { useState } from "react";
import { cn } from "@/lib/utils";
import { type ChecklistItem } from "@/types";

interface ChecklistManagerProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `ci_${Date.now()}_${idCounter}`;
}

export default function ChecklistManager({ items, onChange, readOnly }: ChecklistManagerProps) {
  const [newText, setNewText] = useState("");

  const toggleItem = (itemId: string) => {
    onChange(
      items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const addItem = () => {
    const text = newText.trim();
    if (!text) {return;}
    onChange([...items, { id: nextId(), text, checked: false }]);
    setNewText("");
  };

  const removeItem = (itemId: string) => {
    onChange(items.filter((item) => item.id !== itemId));
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length > 0 ? Math.round((checkedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {checkedCount}/{items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No checklist items yet
          </p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item.id)}
              disabled={readOnly}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span
              className={cn(
                "flex-1 text-sm",
                item.checked && "line-through text-muted-foreground",
              )}
            >
              {item.text}
            </span>
            {!readOnly && (
              <button
                onClick={() => removeItem(item.id)}
                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
            placeholder="Add checklist item..."
            className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={addItem}
            disabled={!newText.trim()}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
