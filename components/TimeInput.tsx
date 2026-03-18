'use client';

interface TimeInputProps {
  hours: number;
  minutes: number;
  onHoursChange: (h: number) => void;
  onMinutesChange: (m: number) => void;
  maxHours?: number;
  size?: 'sm' | 'md';
}

export default function TimeInput({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
  maxHours = 5,
  size = 'md',
}: TimeInputProps) {
  const hourOpts = Array.from({ length: maxHours + 1 }, (_, i) => i);
  const minOpts = Array.from({ length: 60 }, (_, i) => i);

  const cls =
    size === 'sm'
      ? 'bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 cursor-pointer'
      : 'bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 cursor-pointer';

  return (
    <div className="flex items-center gap-2">
      <select value={hours} onChange={(e) => onHoursChange(+e.target.value)} className={cls}>
        {hourOpts.map((h) => (
          <option key={h} value={h}>{h}h</option>
        ))}
      </select>
      <span className="text-slate-400 font-semibold text-sm">:</span>
      <select value={minutes} onChange={(e) => onMinutesChange(+e.target.value)} className={cls}>
        {minOpts.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}m</option>
        ))}
      </select>
    </div>
  );
}
