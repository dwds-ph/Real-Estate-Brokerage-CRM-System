import { useState } from 'react';

interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: 'This Month', getValue: () => getMonthRange() },
  { label: 'Last Month', getValue: () => getLastMonthRange() },
  { label: 'Last 90 Days', getValue: () => get90DayRange() },
  { label: 'This Year', getValue: () => getYearRange() },
  { label: 'All Time', getValue: () => ({ from: '2000-01-01', to: new Date().toISOString().split('T')[0] }) },
];

function getMonthRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  return { from, to };
}

function getLastMonthRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  return { from, to };
}

function get90DayRange(): DateRange {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { from, to };
}

function getYearRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showPresets, setShowPresets] = useState(false);

  const handlePreset = (preset: typeof PRESETS[number]) => {
    onChange(preset.getValue());
    setShowPresets(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          📅 Quick Select
        </button>
        {showPresets && (
          <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-lg border bg-card shadow-lg">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset)}
                className="block w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">From:</label>
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">To:</label>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
