import { type Branch } from "@/types";

interface Props {
  branches: Branch[];
  onEdit: (b: Branch) => void;
  onDelete: (id: string) => void;
  onViewDetail: (b: Branch) => void;
}

export default function BranchList({ branches, onEdit, onDelete, onViewDetail }: Props) {
  if (branches.length === 0) {return <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No branches yet</div>;}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {branches.map((b) => (
        <div key={b.id} className="rounded-lg border bg-card p-4 space-y-2 cursor-pointer hover:shadow-sm" onClick={() => onViewDetail(b)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail(b); } }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{b.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{b.type.replace("-", " ")}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${b.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {b.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>{b.address}, {b.city}, {b.province}</p>
            {b.manager && <p>Manager: {b.manager}</p>}
          </div>
          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit(b)} className="flex-1 rounded border px-2 py-1 text-[10px] font-medium hover:bg-muted">Edit</button>
            <button onClick={() => onDelete(b.id)} className="rounded border border-red-200 px-2 py-1 text-[10px] text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
