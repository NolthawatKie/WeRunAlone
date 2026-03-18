'use client';

import { useEffect } from 'react';
import type { WeekConfig, RaceEntry } from '@/types/plan';
import TimeInput from '@/components/TimeInput';

const DAYS = [
  { id: 'Monday',    short: 'M'  },
  { id: 'Tuesday',   short: 'Tu' },
  { id: 'Wednesday', short: 'W'  },
  { id: 'Thursday',  short: 'Th' },
  { id: 'Friday',    short: 'F'  },
  { id: 'Saturday',  short: 'Sa' },
  { id: 'Sunday',    short: 'Su' },
];

// PR max hours by race distance
const PR_MAX_HOURS: Record<number, number> = {
  5: 1,    // Under 10km — max 1h
  10: 2,   // 10km — max 2h
  21.1: 4, // Half Marathon — max 4h
  42.2: 7, // Full Marathon — max 7h
};

const RACE_DISTANCES: { distance: number; label: string; desc: string; icon: string }[] = [
  { distance: 5,    label: 'Under 10 km',   desc: '5K, 8K, etc.',  icon: '🏃' },
  { distance: 10,   label: '10 km',          desc: '10K race',      icon: '🥈' },
  { distance: 21.1, label: 'Half Marathon',  desc: '21.1 km',       icon: '🥇' },
  { distance: 42.2, label: 'Full Marathon',  desc: '42.2 km',       icon: '🏆' },
];

interface StepTwoProps {
  selectedTarget: string;
  level: string;
  weeks: number;
  selectedDays: string[];
  weekConfig: WeekConfig;
  targetLabel: string;
  minDays: number;
  // Beginner fields
  neverRunBefore: boolean;
  pbDistance: number | null;
  pbTimeH: number;
  pbTimeM: number;
  // Experienced fields
  raceHistory: RaceEntry[];
  onLevelChange: (level: string) => void;
  onWeeksChange: (weeks: number) => void;
  onDayToggle: (day: string) => void;
  onNeverRunBeforeChange: (v: boolean) => void;
  onPbDistanceChange: (v: number | null) => void;
  onPbTimeHChange: (v: number) => void;
  onPbTimeMChange: (v: number) => void;
  onRaceHistoryChange: (history: RaceEntry[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepTwo({
  selectedTarget,
  level,
  weeks,
  selectedDays,
  weekConfig,
  targetLabel,
  minDays,
  neverRunBefore,
  pbDistance,
  pbTimeH,
  pbTimeM,
  raceHistory,
  onLevelChange,
  onWeeksChange,
  onDayToggle,
  onNeverRunBeforeChange,
  onPbDistanceChange,
  onPbTimeHChange,
  onPbTimeMChange,
  onRaceHistoryChange,
  onBack,
  onNext,
}: StepTwoProps) {
  const isFunRun = selectedTarget === 'fun-run';

  // Auto-set to beginner for fun run
  useEffect(() => {
    if (isFunRun && level !== 'beginner') {
      onLevelChange('beginner');
    }
  }, [isFunRun]);

  const isBelowWarn = weeks < weekConfig.warnBelow;
  const midPoint = Math.round((weekConfig.min + weekConfig.max) / 2);
  const isDaysBelowMin = selectedDays.length < minDays;
  const isExperiencedValid = level !== 'intermediate' || isFunRun || raceHistory.length > 0;
  const canNext = !isBelowWarn && !isDaysBelowMin && isExperiencedValid;

  const levelOptions = isFunRun
    ? [{ id: 'beginner', label: 'Beginner', desc: 'Little or no running background', icon: '🌱' }]
    : [
        { id: 'beginner',     label: 'Beginner',    desc: 'Little or no running background', icon: '🌱' },
        { id: 'intermediate', label: 'Experienced', desc: 'Already running regularly',        icon: '⚡' },
      ];

  // ── Helpers for race history ──────────────────────────────────────────────
  const toggleRaceDistance = (rd: typeof RACE_DISTANCES[0]) => {
    const existing = raceHistory.find((r) => r.distance === rd.distance);
    if (existing) {
      onRaceHistoryChange(raceHistory.filter((r) => r.distance !== rd.distance));
    } else {
      onRaceHistoryChange([...raceHistory, { distance: rd.distance, label: rd.label, count: 1, prH: 0, prM: 0 }]);
    }
  };

  const updateRaceCount = (distance: number, count: number) => {
    onRaceHistoryChange(
      raceHistory.map((r) => (r.distance === distance ? { ...r, count: Math.max(1, count) } : r))
    );
  };

  const updateRacePrH = (distance: number, prH: number) => {
    onRaceHistoryChange(
      raceHistory.map((r) => (r.distance === distance ? { ...r, prH } : r))
    );
  };

  const updateRacePrM = (distance: number, prM: number) => {
    onRaceHistoryChange(
      raceHistory.map((r) => (r.distance === distance ? { ...r, prM } : r))
    );
  };

  const updateRaceActualDistance = (distance: number, actualDistance: number | undefined) => {
    onRaceHistoryChange(
      raceHistory.map((r) => (r.distance === distance ? { ...r, actualDistance } : r))
    );
  };

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 uppercase tracking-widest bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
          Step 2 of 4
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-900">Training details</h2>
        <p className="text-slate-500 text-sm mt-1">Tell us about your level and schedule</p>
      </div>

      <div className="space-y-8">

        {/* ── Level selector ─────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Your level</label>
          <div className={`grid gap-3 ${isFunRun ? 'grid-cols-1 max-w-xs' : 'grid-cols-2'}`}>
            {levelOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onLevelChange(opt.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  level === opt.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-200 bg-slate-50 hover:border-purple-300 hover:bg-purple-50/40'
                }`}
              >
                <div className="text-2xl mb-2">{opt.icon}</div>
                <div className="font-semibold text-slate-900 text-sm">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          {isFunRun && (
            <p className="text-xs text-emerald-700 mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              🌱 Fun Run is designed as a beginner-friendly goal — perfect for your first race!
            </p>
          )}
        </div>

        {/* ── Beginner sub-form ─────────────────────────────────────── */}
        {level === 'beginner' && (
          <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Running background</label>

            {/* Never run before toggle */}
            <button
              type="button"
              onClick={() => onNeverRunBeforeChange(!neverRunBefore)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                neverRunBefore
                  ? 'border-emerald-500 bg-emerald-100'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <span className="text-xl">{neverRunBefore ? '✅' : '⬜'}</span>
              <div>
                <div className="text-sm font-semibold text-slate-800">Never run before</div>
                <div className="text-xs text-slate-500">I'm starting from scratch — no running experience</div>
              </div>
            </button>

            {/* PB entry — only if they have run before */}
            {!neverRunBefore && (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold text-slate-600">Your personal best (optional — helps calibrate paces)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Best distance (km)</label>
                    <input
                      type="number" min={1} max={100}
                      value={pbDistance ?? ''}
                      onChange={(e) => onPbDistanceChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="e.g. 5"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Best time — leave 0h 00m to skip</label>
                    <TimeInput
                      hours={pbTimeH}
                      minutes={pbTimeM}
                      onHoursChange={onPbTimeHChange}
                      onMinutesChange={onPbTimeMChange}
                      maxHours={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Experienced sub-form ──────────────────────────────────── */}
        {!isFunRun && level === 'intermediate' && (
          <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Race history</label>
              <p className="text-xs text-slate-500 mb-3">
                Select all distances you&apos;ve raced — add count and your PR for each.
                {raceHistory.length === 0 && (
                  <span className="text-red-500 ml-1 font-semibold">At least one required.</span>
                )}
              </p>
            </div>

            <div className="space-y-3">
              {RACE_DISTANCES.map((rd) => {
                const entry = raceHistory.find((r) => r.distance === rd.distance);
                const isSelected = !!entry;
                const maxH = PR_MAX_HOURS[rd.distance] ?? 3;
                return (
                  <div
                    key={rd.distance}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      isSelected ? 'border-blue-400 bg-white' : 'border-slate-200 bg-white/60'
                    }`}
                  >
                    {/* Distance checkbox row */}
                    <label className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-blue-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRaceDistance(rd)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-500 accent-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-lg">{rd.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{rd.label}</div>
                        <div className="text-xs text-slate-500">{rd.desc}</div>
                      </div>
                    </label>

                    {/* Count + PR (+ actual distance for Under 10 km) — only when selected */}
                    {isSelected && entry && (
                      <div className="px-4 pb-4 border-t border-blue-100 pt-3 space-y-3">
                        <div className={`grid gap-3 ${rd.distance === 5 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                          {/* Actual distance — Under 10 km only */}
                          {rd.distance === 5 && (
                            <div>
                              <label className="block text-xs text-slate-500 mb-1.5">Your distance (km)</label>
                              <input
                                type="number"
                                min={1}
                                max={9.9}
                                step={0.1}
                                value={entry.actualDistance ?? ''}
                                onChange={(e) =>
                                  updateRaceActualDistance(rd.distance, e.target.value ? Number(e.target.value) : undefined)
                                }
                                placeholder="e.g. 5"
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-xs text-slate-500 mb-1.5">Times raced</label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateRaceCount(rd.distance, entry.count - 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer flex-shrink-0"
                              >−</button>
                              <span className="flex-1 text-center font-bold text-slate-900 text-lg">{entry.count}</span>
                              <button
                                type="button"
                                onClick={() => updateRaceCount(rd.distance, entry.count + 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer flex-shrink-0"
                              >+</button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1.5">
                            PR time <span className="text-slate-400">(optional — leave 0h 00m to skip)</span>
                          </label>
                          <TimeInput
                            hours={entry.prH}
                            minutes={entry.prM}
                            onHoursChange={(h) => updateRacePrH(rd.distance, h)}
                            onMinutesChange={(m) => updateRacePrM(rd.distance, m)}
                            maxHours={maxH}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isExperiencedValid && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                ⛔ Select at least one race distance to continue.
              </p>
            )}
          </div>
        )}

        {/* ── Weeks + Days (2-col on desktop) ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Weeks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Training duration</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onWeeksChange(Math.max(weekConfig.min, weeks - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
              >−</button>
              <div className="flex-1">
                <input
                  type="range"
                  min={weekConfig.min}
                  max={weekConfig.max}
                  value={weeks}
                  onChange={(e) => onWeeksChange(Number(e.target.value))}
                  className="w-full h-2 appearance-none bg-slate-200 rounded-full outline-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
                  <span>{weekConfig.min}</span>
                  <span>{midPoint}</span>
                  <span>{weekConfig.max}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onWeeksChange(Math.min(weekConfig.max, weeks + 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center flex-shrink-0 cursor-pointer"
              >+</button>
            </div>
            <div className="text-center mt-2">
              <span className="text-2xl font-bold text-blue-600">{weeks}</span>
              <span className="text-slate-500 ml-1 text-sm">weeks</span>
              <span className="text-slate-400 text-xs ml-2">(recommended: {weekConfig.default})</span>
            </div>
            {isBelowWarn && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs leading-relaxed">
                ⛔ <span className="font-semibold">{weeks} weeks is too short for {targetLabel}</span>
                <br />
                Minimum recommended: <span className="font-semibold">{weekConfig.warnBelow} weeks</span> — to reduce injury risk and reach your goal safely.
              </div>
            )}
          </div>

          {/* Days */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Available training days
              <span className="ml-2 text-xs font-normal text-slate-500">({selectedDays.length} / {minDays}+ days required)</span>
            </label>
            <div className="grid grid-cols-7 gap-2 mt-3">
              {DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => onDayToggle(day.id)}
                    title={day.id}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95 ${
                      isSelected
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'
                    }`}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 min-h-[24px]">
              {selectedDays.map((day) => (
                <span key={day} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                  {day}
                </span>
              ))}
            </div>
            {selectedDays.length > 0 && isDaysBelowMin && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 text-xs leading-relaxed">
                ⚠️ <span className="font-semibold">{targetLabel} requires at least {minDays} training days/week.</span>
                <br />
                Add {minDays - selectedDays.length} more {minDays - selectedDays.length === 1 ? 'day' : 'days'} to continue.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 font-medium text-sm cursor-pointer"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
            canNext
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Next → HR Max
        </button>
      </div>
    </div>
  );
}
