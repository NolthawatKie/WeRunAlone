'use client';

import TimeInput from '@/components/TimeInput';
import type { WeekConfig } from '@/types/plan';

interface TimeConfig {
  defaultH: number;
  defaultM: number;
  maxHours: number;
  minTotalMin: number; // below this = physically impossible for any runner
  presets: { label: string; h: number; m: number }[];
}

interface Target {
  id: string;
  label: string;
  icon: string;
  distance: number;
  description: string;
  accent: string;
  accentBg: string;
  weekConfig: WeekConfig;
  minDays: number;
  timeConfig: TimeConfig;
}

const TARGETS: Target[] = [
  {
    id: 'fun-run',
    label: 'Fun Run',
    icon: '🏃',
    distance: 5,
    description: '5 km · Entry level',
    accent: 'border-emerald-500',
    accentBg: 'bg-emerald-100',
    weekConfig: { min: 1, max: 12, default: 6, warnBelow: 4 },
    minDays: 3,
    timeConfig: {
      defaultH: 0, defaultM: 30, maxHours: 2, minTotalMin: 15,
      presets: [
        { label: 'Sub 20', h: 0, m: 20 },
        { label: 'Sub 25', h: 0, m: 25 },
        { label: 'Sub 30', h: 0, m: 30 },
        { label: 'Sub 40', h: 0, m: 40 },
      ],
    },
  },
  {
    id: 'mini-marathon',
    label: 'Mini Marathon',
    icon: '🥈',
    distance: 10,
    description: '10 km · Real test',
    accent: 'border-blue-500',
    accentBg: 'bg-blue-100',
    weekConfig: { min: 4, max: 20, default: 12, warnBelow: 8 },
    minDays: 3,
    timeConfig: {
      defaultH: 1, defaultM: 0, maxHours: 3, minTotalMin: 28,
      presets: [
        { label: 'Sub 40', h: 0, m: 40 },
        { label: 'Sub 50', h: 0, m: 50 },
        { label: 'Sub 1:00', h: 1, m: 0 },
        { label: 'Sub 1:20', h: 1, m: 20 },
      ],
    },
  },
  {
    id: 'half-marathon',
    label: 'Half Marathon',
    icon: '🥇',
    distance: 21.1,
    description: '21.1 km · Serious goal',
    accent: 'border-amber-500',
    accentBg: 'bg-amber-100',
    weekConfig: { min: 8, max: 24, default: 16, warnBelow: 12 },
    minDays: 4,
    timeConfig: {
      defaultH: 2, defaultM: 0, maxHours: 6, minTotalMin: 60,
      presets: [
        { label: 'Sub 1:30', h: 1, m: 30 },
        { label: 'Sub 1:45', h: 1, m: 45 },
        { label: 'Sub 2:00', h: 2, m: 0 },
        { label: 'Sub 2:30', h: 2, m: 30 },
      ],
    },
  },
  {
    id: 'full-marathon',
    label: 'Full Marathon',
    icon: '🏆',
    distance: 42.2,
    description: '42.2 km · Ultimate challenge',
    accent: 'border-rose-500',
    accentBg: 'bg-rose-100',
    weekConfig: { min: 12, max: 30, default: 20, warnBelow: 16 },
    minDays: 5,
    timeConfig: {
      defaultH: 4, defaultM: 30, maxHours: 10, minTotalMin: 120,
      presets: [
        { label: 'Sub 3:00', h: 3, m: 0 },
        { label: 'Sub 3:30', h: 3, m: 30 },
        { label: 'Sub 4:00', h: 4, m: 0 },
        { label: 'Sub 5:00', h: 5, m: 0 },
      ],
    },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcPace(totalMin: number, distanceKm: number): string {
  const paceDecimal = totalMin / distanceKm;
  const paceMin = Math.floor(paceDecimal);
  const paceSec = Math.round((paceDecimal - paceMin) * 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface StepOneProps {
  selected: string;
  targetTimeH: number;
  targetTimeM: number;
  onSelect: (
    id: string,
    label: string,
    distance: number,
    weekConfig: WeekConfig,
    minDays: number,
    defaultTimeH: number,
    defaultTimeM: number,
  ) => void;
  onTargetTimeHChange: (h: number) => void;
  onTargetTimeMChange: (m: number) => void;
  onNext: () => void;
}

export default function StepOne({
  selected,
  targetTimeH,
  targetTimeM,
  onSelect,
  onTargetTimeHChange,
  onTargetTimeMChange,
  onNext,
}: StepOneProps) {
  const selectedTarget = TARGETS.find((t) => t.id === selected);
  const totalMin = targetTimeH * 60 + targetTimeM;
  const isTimeSet = totalMin > 0;
  const isTooFast = !!(selectedTarget && isTimeSet && totalMin < selectedTarget.timeConfig.minTotalMin);
  const isTimeValid = isTimeSet && !isTooFast;
  const canNext = !!selected && isTimeValid;

  const paceStr =
    selectedTarget && isTimeSet
      ? `${calcPace(totalMin, selectedTarget.distance)} min/km`
      : null;

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          Step 1 of 4
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-900">Choose your race goal</h2>
        <p className="text-slate-500 text-sm mt-1">Select the distance you want to train for</p>
      </div>

      {/* ── Target cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TARGETS.map((target) => {
          const isSelected = selected === target.id;
          return (
            <button
              key={target.id}
              onClick={() =>
                onSelect(
                  target.id,
                  target.label,
                  target.distance,
                  target.weekConfig,
                  target.minDays,
                  target.timeConfig.defaultH,
                  target.timeConfig.defaultM,
                )
              }
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? `${target.accent} ${target.accentBg} shadow-lg`
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="text-3xl mb-3">{target.icon}</div>
              <div className="font-bold text-slate-900 text-base leading-tight">{target.label}</div>
              <div className="text-sm text-slate-500 mt-1">{target.description}</div>
              <div className="text-xs text-slate-400 mt-2">{target.weekConfig.default} weeks · {target.minDays}+ days/week</div>
            </button>
          );
        })}
      </div>

      {/* ── Target Time section (shows after target is selected) ─────────── */}
      {selectedTarget && (
        <div className="mt-6 p-5 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎯</span>
            <label className="text-sm font-semibold text-slate-700">Target Finish Time</label>
            <span className="text-xs text-slate-500 ml-1">— how fast do you want to finish?</span>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-2 mb-4 mt-3">
            {selectedTarget.timeConfig.presets.map((p) => {
              const presetTotal = p.h * 60 + p.m;
              const isActive = targetTimeH === p.h && targetTimeM === p.m;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { onTargetTimeHChange(p.h); onTargetTimeMChange(p.m); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-100'
                  }`}
                >
                  {p.label}
                  <span className="ml-1 opacity-70 font-normal">
                    · {calcPace(presetTotal, selectedTarget.distance)}/km
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom time input */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-slate-500 mb-2">Or enter a custom time:</p>
              <TimeInput
                hours={targetTimeH}
                minutes={targetTimeM}
                onHoursChange={onTargetTimeHChange}
                onMinutesChange={onTargetTimeMChange}
                maxHours={selectedTarget.timeConfig.maxHours}
              />
            </div>

            {/* Pace display */}
            {paceStr && !isTooFast && (
              <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-lg">⚡</span>
                <div>
                  <div className="text-xs text-slate-500 leading-none mb-0.5">Average pace needed</div>
                  <div className="text-lg font-bold text-blue-600 leading-none">{paceStr}</div>
                </div>
              </div>
            )}
          </div>

          {/* Validation messages */}
          {!isTimeSet && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⏱ Please set a target finish time to continue.
            </p>
          )}
          {isTooFast && (
            <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
              ⛔ That time is faster than world-record pace for {selectedTarget.label} — please set a realistic target.
            </p>
          )}
        </div>
      )}

      {/* ── Next button ──────────────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
            canNext
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {!selected ? 'Select a race goal to continue' : !isTimeSet ? 'Set a target time to continue' : 'Next → Training Details'}
        </button>
      </div>
    </div>
  );
}
