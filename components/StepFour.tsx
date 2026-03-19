'use client';

import type { RaceEntry } from '@/types/plan';

interface StepFourProps {
  // Step 1
  targetLabel: string;
  targetDistance: number;
  targetTimeH: number;
  targetTimeM: number;
  // Step 2
  level: string;
  weeks: number;
  selectedDays: string[];
  neverRunBefore: boolean;
  pbDistance: number | null;
  pbTimeH: number;
  pbTimeM: number;
  raceHistory: RaceEntry[];
  // Step 3
  hrMax: number | null;
  onBack: () => void;
  onFindSimilar: () => void;
  finding?: boolean;
}

function formatTime(h: number, m: number): string {
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function calcPace(totalMin: number, distanceKm: number): string {
  const paceDecimal = totalMin / distanceKm;
  const paceMin = Math.floor(paceDecimal);
  const paceSec = Math.round((paceDecimal - paceMin) * 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')} min/km`;
}

function formatPrTime(prH: number, prM: number): string | null {
  if (prH === 0 && prM === 0) return null;
  return `${prH}h ${String(prM).padStart(2, '0')}m`;
}

function Row({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">{label}</div>
        <div className="text-slate-800 font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function StepFour({
  targetLabel,
  targetDistance,
  targetTimeH,
  targetTimeM,
  level,
  weeks,
  selectedDays,
  neverRunBefore,
  pbDistance,
  pbTimeH,
  pbTimeM,
  raceHistory,
  hrMax,
  onBack,
  onFindSimilar,
  finding = false,
}: StepFourProps) {
  const isExperienced = level === 'intermediate';
  const totalMin = targetTimeH * 60 + targetTimeM;
  const avgPace = totalMin > 0 ? calcPace(totalMin, targetDistance) : null;

  const runningBackground = () => {
    if (isExperienced) {
      if (raceHistory.length === 0) return 'No races entered';
      return (
        <div className="space-y-1 mt-1">
          {raceHistory.map((r) => {
            const prStr = formatPrTime(r.prH, r.prM);
            return (
              <div key={r.distance} className="flex items-center gap-2 text-sm">
                <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {r.distance === 5 && r.actualDistance ? `${r.actualDistance} km` : r.label}
                </span>
                <span className="text-slate-600">×{r.count} races</span>
                {prStr && <span className="text-slate-500 text-xs">· PR: {prStr}</span>}
              </div>
            );
          })}
        </div>
      );
    }
    if (neverRunBefore) return 'Never run before (starting from scratch)';
    if (pbDistance && (pbTimeH > 0 || pbTimeM > 0)) {
      return `Personal Best: ${pbDistance} km in ${formatTime(pbTimeH, pbTimeM)}`;
    }
    if (pbDistance) return `Personal Best: ${pbDistance} km (no time recorded)`;
    return 'Beginner — no PB recorded';
  };

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-600 uppercase tracking-widest bg-green-50 border border-green-200 px-3 py-1 rounded-full">
          Step 4 of 4
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-900">Review your plan inputs</h2>
        <p className="text-slate-500 text-sm mt-1">Confirm everything looks right before generating</p>
      </div>

      {/* Summary card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2 mb-6">
        <Row icon="🎯" label="Race Goal" value={`${targetLabel} — ${targetDistance} km`} />
        <Row
          icon="⏱"
          label="Target Finish Time"
          value={
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-blue-600">{formatTime(targetTimeH, targetTimeM)}</span>
              {avgPace && (
                <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  ⚡ {avgPace} avg pace
                </span>
              )}
            </div>
          }
        />
        <Row icon={isExperienced ? '⚡' : '🌱'} label="Level" value={isExperienced ? 'Experienced runner' : 'Beginner'} />
        <Row icon="📋" label="Running Background" value={runningBackground()} />
        <Row icon="📆" label="Training Duration" value={`${weeks} weeks`} />
        <Row
          icon="📅"
          label="Training Days"
          value={
            <div className="flex flex-wrap gap-1.5 mt-1">
              {selectedDays.map((d) => (
                <span key={d} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  {d}
                </span>
              ))}
              <span className="text-xs text-slate-400 self-center">({selectedDays.length} days/week)</span>
            </div>
          }
        />
        <Row
          icon="❤️"
          label="Heart Rate Max"
          value={hrMax ? `${hrMax} bpm` : '—'}
        />
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-xs text-blue-700">
        <span className="text-base flex-shrink-0">🤖</span>
        <span>Claude AI will use all of this to build a personalised plan tailored to your goal, experience, and schedule. Generation takes 15–30 seconds.</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 font-medium text-sm cursor-pointer"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onFindSimilar}
          disabled={finding}
          className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
        >
          {finding ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            'Find Similar Plans'
          )}
        </button>
      </div>
    </div>
  );
}
