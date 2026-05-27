import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton block with animate-pulse.
 */
function SkeletonBlock({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
        className,
      )}
    />
  );
}

/**
 * Card skeleton — mimics a typical card layout.
 */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-4/5" />
      <div className="flex gap-2 pt-2">
        <SkeletonBlock className="h-8 w-16 rounded-lg" />
        <SkeletonBlock className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton — mimics a table row with cells.
 */
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-2">
          <SkeletonBlock className={cn('h-4', i === 0 ? 'w-3/4' : 'w-1/2')} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Table skeleton — full table with header and rows.
 */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-3 px-2 text-left">
                <SkeletonBlock className="h-4 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * List item skeleton — mimics a list row with avatar + text.
 */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <SkeletonBlock className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonBlock className="h-4 w-2/5" />
        <SkeletonBlock className="h-3 w-1/4" />
      </div>
      <SkeletonBlock className="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * Page skeleton — general purpose loading placeholder for pages.
 */
export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-40" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default SkeletonBlock;
