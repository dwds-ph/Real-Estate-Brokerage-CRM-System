import { useState } from 'react';
import { VaultDocument } from '@/types';
import { getCategoryInfo, formatFileSize } from '@/services/documentVault';
import { formatDate, cn } from '@/lib/utils';

interface DocumentListProps {
  documents: VaultDocument[];
  loading: boolean;
  error: string | null;
  onSelect?: (doc: VaultDocument) => void;
  onDelete?: (doc: VaultDocument) => void;
  selectedId?: string;
}

export default function DocumentList({
  documents,
  loading,
  error,
  onSelect,
  onDelete,
  selectedId,
}: DocumentListProps) {
  const [sortBy, setSortBy] = useState<'name' | 'uploadedAt' | 'expiryDate'>('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'name' | 'uploadedAt' | 'expiryDate') => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sorted = [...documents].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    } else if (sortBy === 'uploadedAt') {
      cmp = a.uploadedAt - b.uploadedAt;
    } else if (sortBy === 'expiryDate') {
      const aExp = a.expiryDate || 0;
      const bExp = b.expiryDate || 0;
      cmp = aExp - bExp;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const [now] = useState(() => Date.now());
  const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <span className="text-4xl mb-2">📄</span>
        <p className="text-sm font-medium">No documents found</p>
        <p className="text-xs">Upload documents using the button above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium">Sort:</span>
        <button
          onClick={() => handleSort('uploadedAt')}
          className={cn(
            'rounded px-2 py-1 hover:bg-muted',
            sortBy === 'uploadedAt' && 'bg-muted font-medium text-foreground',
          )}
        >
          Date {sortBy === 'uploadedAt' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('name')}
          className={cn(
            'rounded px-2 py-1 hover:bg-muted',
            sortBy === 'name' && 'bg-muted font-medium text-foreground',
          )}
        >
          Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSort('expiryDate')}
          className={cn(
            'rounded px-2 py-1 hover:bg-muted',
            sortBy === 'expiryDate' && 'bg-muted font-medium text-foreground',
          )}
        >
          Expiry {sortBy === 'expiryDate' && (sortDir === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Document items */}
      <div className="divide-y rounded-lg border">
        {sorted.map((doc) => {
          const catInfo = getCategoryInfo(doc.category);
          const isExpiring =
            doc.expiryDate && doc.expiryDate > now && doc.expiryDate <= sevenDaysFromNow;
          const isExpired = doc.expiryDate && doc.expiryDate <= now;

          return (
            <div
              key={doc.id}
              onClick={() => onSelect?.(doc)}
              className={cn(
                'flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50',
                selectedId === doc.id && 'bg-muted',
                isExpired && 'opacity-60',
              )}
            >
              {/* File icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <span className="text-lg">
                  {doc.fileType.includes('pdf') ? '📕' :
                   doc.fileType.includes('image') ? '🖼️' :
                   doc.fileType.includes('sheet') || doc.fileType.includes('excel') ? '📊' :
                   doc.fileType.includes('word') || doc.fileType.includes('document') ? '📝' : '📄'}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  {doc.version > 1 && (
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      v{doc.version}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className={cn('inline-block rounded-full px-2 py-0.5 text-[10px] font-medium', catInfo.color)}>
                    {catInfo.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
                  {doc.stage && (
                    <span className="text-[10px] text-muted-foreground">• {doc.stage}</span>
                  )}
                </div>
              </div>

              {/* Expiry indicator */}
              <div className="shrink-0 text-right">
                {isExpired ? (
                  <span className="text-[10px] font-medium text-red-500">Expired</span>
                ) : isExpiring ? (
                  <span className="text-[10px] font-medium text-amber-500">
                    Expires {formatDate(doc.expiryDate!)}
                  </span>
                ) : doc.expiryDate ? (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(doc.expiryDate)}
                  </span>
                ) : null}
              </div>

              {/* Delete */}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(doc);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
                  title="Delete"
                >
                  🗑️
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {documents.length} document{documents.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
