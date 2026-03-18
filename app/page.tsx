'use client';

import { useState } from 'react';
import Link from 'next/link';
import LandingPage from '@/components/LandingPage';
import StepOne from '@/components/StepOne';
import StepTwo from '@/components/StepTwo';
import StepThree from '@/components/StepThree';
import StepFour from '@/components/StepFour';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import OutputPlan from '@/components/OutputPlan';
import type { TrainingPlan, WeekConfig, RaceEntry } from '@/types/plan';
import WeatherNavBadge from '@/components/WeatherNavBadge';

type AppState = 'landing' | 'input' | 'loading' | 'output' | 'error';

const DEFAULT_WEEK_CONFIG: WeekConfig = { min: 1, max: 30, default: 8, warnBelow: 4 };

function formatTime(h: number, m: number): string {
  return `${h}:${String(m).padStart(2, '0')}:00`;
}

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [appState, setAppState] = useState<AppState>('landing');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 — target
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedTargetLabel, setSelectedTargetLabel] = useState('');
  const [selectedTargetDistance, setSelectedTargetDistance] = useState(0);
  const [weekConfig, setWeekConfig] = useState<WeekConfig>(DEFAULT_WEEK_CONFIG);
  const [minDays, setMinDays] = useState(3);
  // Target time
  const [targetTimeH, setTargetTimeH] = useState(0);
  const [targetTimeM, setTargetTimeM] = useState(0);

  // Step 2 — level, weeks, days
  const [level, setLevel] = useState('beginner');
  const [weeks, setWeeks] = useState(8);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  // Beginner fields
  const [neverRunBefore, setNeverRunBefore] = useState(false);
  const [pbDistance, setPbDistance] = useState<number | null>(null);
  const [pbTimeH, setPbTimeH] = useState(0);
  const [pbTimeM, setPbTimeM] = useState(0);
  // Experienced fields
  const [raceHistory, setRaceHistory] = useState<RaceEntry[]>([]);

  // Step 3 — HR
  const [hrMax, setHrMax] = useState<number | null>(null);

  const handleTargetSelect = (
    id: string,
    label: string,
    distance: number,
    config: WeekConfig,
    targetMinDays: number,
    defaultTimeH: number,
    defaultTimeM: number,
  ) => {
    setSelectedTarget(id);
    setSelectedTargetLabel(label);
    setSelectedTargetDistance(distance);
    setWeekConfig(config);
    setWeeks(config.default);
    setMinDays(targetMinDays);
    // Reset target time to the new target's defaults
    setTargetTimeH(defaultTimeH);
    setTargetTimeM(defaultTimeM);
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleGenerate = async () => {
    setAppState('loading');
    setErrorMsg('');

    // Compose time strings from H+M
    const pbTimeStr = (level === 'beginner' && !neverRunBefore && (pbTimeH > 0 || pbTimeM > 0))
      ? formatTime(pbTimeH, pbTimeM)
      : '';
    const targetTimeStr = formatTime(targetTimeH, targetTimeM);
    const targetTimeTotalMin = targetTimeH * 60 + targetTimeM;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: selectedTarget,
          targetLabel: selectedTargetLabel,
          targetDistance: selectedTargetDistance,
          targetTimeH,
          targetTimeM,
          targetTimeStr,
          targetTimeTotalMin,
          level,
          weeks,
          days: selectedDays,
          hrMax,
          // Beginner
          neverRunBefore: level === 'beginner' ? neverRunBefore : false,
          pbDistance: level === 'beginner' && !neverRunBefore ? pbDistance : null,
          pbTime: pbTimeStr,
          // Experienced
          raceHistory: level === 'intermediate' ? raceHistory : [],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'API error');

      setPlan(data);
      setAppState('output');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setAppState('error');
    }
  };

  const handleReset = () => {
    setPlan(null);
    setAppState('landing');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStart = () => {
    setAppState('input');
    setStep(1);
  };

  const STEP_LABELS = ['Goal', 'Details', 'HR Max', 'Review'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-2 group cursor-pointer">
            <span className="text-xl">🏃</span>
            <span className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">
              WeRunAlone
            </span>
          </button>
          <div className="flex items-center gap-3">
            <WeatherNavBadge />
            {/* <Link href="/community" className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors hidden sm:block">
              🌍 Community
            </Link> */}
            {appState === 'output' && (
              <span className="text-xs text-slate-500">Training Plan</span>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full py-6">
        {/* Landing */}
        {appState === 'landing' && <LandingPage onStart={handleStart} />}

        {/* Input form */}
        {(appState === 'input' || appState === 'error') && (
          <div className="max-w-5xl mx-auto px-6">
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-8">
              {([1, 2, 3, 4] as const).map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                      step === s
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {step > s ? '✓' : s}
                    </div>
                    <span className={`text-xs hidden sm:block transition-colors ${
                      step === s ? 'text-blue-600 font-semibold' : step > s ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{STEP_LABELS[s - 1]}</span>
                  </div>
                  {s < 4 && <div className={`h-px w-8 sm:w-12 mx-1 transition-all flex-shrink-0 ${step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            {appState === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-700 text-sm">
                <span className="font-semibold">Error:</span> {errorMsg}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {step === 1 && (
                <StepOne
                  selected={selectedTarget}
                  targetTimeH={targetTimeH}
                  targetTimeM={targetTimeM}
                  onSelect={handleTargetSelect}
                  onTargetTimeHChange={setTargetTimeH}
                  onTargetTimeMChange={setTargetTimeM}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <StepTwo
                  selectedTarget={selectedTarget}
                  level={level}
                  weeks={weeks}
                  selectedDays={selectedDays}
                  weekConfig={weekConfig}
                  targetLabel={selectedTargetLabel}
                  minDays={minDays}
                  neverRunBefore={neverRunBefore}
                  pbDistance={pbDistance}
                  pbTimeH={pbTimeH}
                  pbTimeM={pbTimeM}
                  raceHistory={raceHistory}
                  onLevelChange={setLevel}
                  onWeeksChange={setWeeks}
                  onDayToggle={handleDayToggle}
                  onNeverRunBeforeChange={setNeverRunBefore}
                  onPbDistanceChange={setPbDistance}
                  onPbTimeHChange={setPbTimeH}
                  onPbTimeMChange={setPbTimeM}
                  onRaceHistoryChange={setRaceHistory}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <StepThree
                  hrMax={hrMax}
                  onHrMaxChange={setHrMax}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              )}

              {step === 4 && (
                <StepFour
                  targetLabel={selectedTargetLabel}
                  targetDistance={selectedTargetDistance}
                  targetTimeH={targetTimeH}
                  targetTimeM={targetTimeM}
                  level={level}
                  weeks={weeks}
                  selectedDays={selectedDays}
                  neverRunBefore={neverRunBefore}
                  pbDistance={pbDistance}
                  pbTimeH={pbTimeH}
                  pbTimeM={pbTimeM}
                  raceHistory={raceHistory}
                  hrMax={hrMax}
                  onBack={() => setStep(3)}
                  onSubmit={handleGenerate}
                />
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {appState === 'loading' && (
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-left">
                  <div className="text-blue-600 font-semibold text-sm">AI is building your plan...</div>
                  <div className="text-slate-500 text-xs mt-0.5">Usually 15–30 seconds</div>
                </div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        )}

        {/* Output */}
        {appState === 'output' && plan && (
          <div className="max-w-5xl mx-auto px-4">
            <OutputPlan
              plan={plan}
              formSummary={{
                targetLabel: selectedTargetLabel,
                targetDistance: selectedTargetDistance,
                targetTimeH,
                targetTimeM,
                level,
                weeks,
                days: selectedDays,
                hrMax,
                neverRunBefore,
                pbDistance,
                pbTimeH,
                pbTimeM,
                raceHistory,
              }}
              onReset={handleReset}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      {(appState === 'landing' || appState === 'input' || appState === 'error') && (
        <footer className="border-t border-slate-200 py-8 mt-auto">
          <div className="text-center">
            <div className="text-base font-bold text-slate-900 tracking-tight">WeRunAlone</div>
            <div className="text-xs text-slate-400 mt-1 tracking-wide">Run solo, Run free, Then We Run Alone.</div>
          </div>
        </footer>
      )}
    </div>
  );
}
