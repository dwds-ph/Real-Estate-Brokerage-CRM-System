import { ShortcutDef } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsHelpModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts: ShortcutDef[];
}

export default function ShortcutsHelpModal({ open, onClose, shortcuts }: ShortcutsHelpModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-muted"
          >
            Esc
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-sm">{s.description}</span>
              <kbd className="rounded border bg-background px-2 py-0.5 text-xs font-mono">
                {s.keys.join(' + ')}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press <kbd className="rounded border bg-background px-1 text-xs font-mono">?</kbd> to toggle this help
        </p>
      </div>
    </div>
  );
}
