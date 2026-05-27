import { useState } from 'react';
import { Mortgage, MortgageStage } from '@/types';
import { advanceMortgageStage, updateStageNotes, MORTGAGE_STAGES, STAGE_ORDER } from '@/services/mortgageService';
import { formatDate, cn } from '@/lib/utils';

interface MortgageTrackerProps {
  mortgage: Mortgage;
  onUpdate?: () => void;
  compact?: boolean;
}

const STAGE_ICONS: Record<MortgageStage, string> = {
  'application': '📋',
  'bank-evaluation': '🔍',
  'bir-docs': '📄',
  'rod': '🏛️',
  'loan-release': '💰',
};

export default function MortgageTracker({ mortgage, onUpdate, compact }: MortgageTrackerProps) {
  const [advancing, setAdvancing] = useState(false);
  const [editingNotes, setEditingNotes] = useState<MortgageStage | null>(null);
  const [notesText, setNotesText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentIndex = STAGE_ORDER.indexOf(mortgage.currentStage);
  const isComplete = mortgage.status === 'approved' || mortgage.status === 'rejected';

  const handleAdvance = async () => {
    if (isComplete || advancing) return;
    if (!window.confirm(`Advance to next stage "${getNextStageLabel()}"?`)) return;

    setAdvancing(true);
    setError(null);
    try {
      await advanceMortgageStage(mortgage.id, mortgage);
      onUpdate?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to advance stage';
      setError(message);
    } finally {
      setAdvancing(false);
    }
  };

  const getNextStageLabel = (): string => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= STAGE_ORDER.length) return 'Complete';
    return MORTGAGE_STAGES.find((s) => s.key === STAGE_ORDER[nextIndex])?.label || '';
  };

  const handleNotesSave = async (stageKey: MortgageStage) => {
    try {
      await updateStageNotes(mortgage.id, mortgage.stages, stageKey, notesText);
      setEditingNotes(null);
      onUpdate?.();
    } catch {
      setError('Failed to save notes');
    }
  };

  const renderStage = (stageKey: MortgageStage, index: number) => {
    const stage = mortgage.stages.find((s) => s.key === stageKey);
    if (!stage) return null;

    const isActive = stageKey === mortgage.currentStage;
    const isDone = stage.status === 'done';
    const stageInfo = MORTGAGE_STAGES.find((s) => s.key === stageKey);
    const isPassed = index <= currentIndex;

    return (
      <div
        key={stageKey}
        className={cn(
          'flex items-start gap-3 rounded-lg border p-3 transition-colors',
          isActive && !isComplete && 'border-primary bg-primary/5',
          isDone && 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
          !isPassed && !isDone && 'opacity-50',
          compact && 'p-2',
        )}
      >
        {/* Stage icon + connector */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm',
              isDone && 'bg-green-500 text-white',
              isActive && !isDone && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
              !isPassed && !isDone && 'bg-muted text-muted-foreground',
            )}
          >
            {isDone ? '✓' : STAGE_ICONS[stageKey]}
          </div>
          {index < STAGE_ORDER.length - 1 && (
            <div
              className={cn(
                'mt-1 h-8 w-0.5',
                isDone ? 'bg-green-400' : 'bg-border',
              )}
            />
          )}
        </div>

        {/* Stage content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={cn('text-sm font-medium', compact && 'text-xs')}>
                {stageInfo?.label || stageKey}
              </p>
              {stageInfo?.description && !compact && (
                <p className="text-xs text-muted-foreground">{stageInfo.description}</p>
              )}
            </div>
            <span
              className={cn(
                'whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium',
                stage.status === 'done' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
                stage.status === 'in-progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
                stage.status === 'pending' && 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
              )}
            >
              {stage.status === 'in-progress' ? 'In Progress' : stage.status === 'done' ? 'Done' : 'Pending'}
            </span>
          </div>

          {/* Dates */}
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground">
            {stage.startedAt && (
              <span>Started: {formatDate(stage.startedAt)}</span>
            )}
            {stage.completedAt && (
              <span>Completed: {formatDate(stage.completedAt)}</span>
            )}
          </div>

          {/* Notes */}
          {editingNotes === stageKey ? (
            <div className="mt-2 space-y-1">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                rows={2}
                placeholder="Add notes for this stage..."
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handleNotesSave(stageKey)}
                  className="rounded bg-primary px-2 py-0.5 text-[10px] text-primary-foreground"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingNotes(null)}
                  className="rounded border px-2 py-0.5 text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {stage.notes && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  📝 {stage.notes}
                </p>
              )}
              {isActive && !isComplete && (
                <button
                  onClick={() => {
                    setNotesText(stage.notes || '');
                    setEditingNotes(stageKey);
                  }}
                  className="mt-1 text-[10px] text-primary hover:underline"
                >
                  {stage.notes ? 'Edit Notes' : '+ Add Notes'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Mortgage Progress</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                mortgage.status === 'ongoing' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
                mortgage.status === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
                mortgage.status === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
              )}
            >
              {mortgage.status.charAt(0).toUpperCase() + mortgage.status.slice(1)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Stage {currentIndex + 1} of {STAGE_ORDER.length}
            </span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((currentIndex + 1) / STAGE_ORDER.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stage timeline */}
      <div className="space-y-0">
        {STAGE_ORDER.map((stageKey, index) => renderStage(stageKey, index))}
      </div>

      {/* Advance button */}
      {!isComplete && !compact && (
        <div className="flex justify-center pt-1">
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {advancing ? 'Advancing...' : `Advance to ${getNextStageLabel()}`}
          </button>
        </div>
      )}

      {compact && !isComplete && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="w-full rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {advancing ? 'Advancing...' : `Advance ➜ ${getNextStageLabel()}`}
        </button>
      )}
    </div>
  );
}
