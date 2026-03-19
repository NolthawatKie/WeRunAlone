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
import SimilarPlansPanel from '@/components/SimilarPlansPanel';
import CommunityPlanModal from '@/components/CommunityPlanModal';
import type { TrainingPlan, WeekConfig, RaceEntry } from '@/types/plan';
import WeatherNavBadge from '@/components/WeatherNavBadge';

type AppState = 'landing' | 'input' | 'loading' | 'output' | 'error' | 'similar';

interface SimilarPlan {
  id: string;
  plan_name: string;
  target: string;
  level: string;
  weeks: number;
  run_days: string[];
  hr_max: number | null;
  shared_by: string | null;
  download_count: number;
}

interface FullPlanEntry extends SimilarPlan {
  plan_data: TrainingPlan;
}
type ModalType = 'token_limit' | 'rate_limit' | 'no_similar' | null;

const DEFAULT_WEEK_CONFIG: WeekConfig = { min: 1, max: 30, default: 8, warnBelow: 4 };

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const sortDays = (days: string[]) =>
  [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

function formatTime(h: number, m: number): string {
  return `${h}:${String(m).padStart(2, '0')}:00`;
}

export default function Home() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [appState, setAppState] = useState<AppState>('landing');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [modal, setModal] = useState<ModalType>(null);

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

  // Similar plans flow
  const [similarPlans, setSimilarPlans] = useState<SimilarPlan[]>([]);
  const [findingPlans, setFindingPlans] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [viewingPlanId, setViewingPlanId] = useState<string | null>(null);
  const [viewedCommunityPlan, setViewedCommunityPlan] = useState<FullPlanEntry | null>(null);

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
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      return sortDays(next);
    });
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

      if (response.status === 429 && data.error === 'RATE_LIMIT') {
        setModal('rate_limit');
        setAppState('input');
        return;
      }
      if (response.status === 422 && data.error === 'TOKEN_LIMIT') {
        setModal('token_limit');
        setAppState('input');
        return;
      }
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

  const handleFindSimilar = async () => {
    setFindingPlans(true);
    try {
      const params = new URLSearchParams({
        target: selectedTargetLabel,
        level,
        weeksNear: String(weeks),
      });
      const res = await fetch(`/api/community/list?${params}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length > 0) {
        setSimilarPlans(data);
        setAppState('similar');
      } else {
        setModal('no_similar');
      }
    } catch {
      setModal('no_similar');
    } finally {
      setFindingPlans(false);
    }
  };

  const TARGET_DISTANCES: Record<string, number> = {
    'Fun Run': 5,
    'Mini Marathon': 10,
    'Half Marathon': 21.1,
    'Full Marathon': 42.2,
  };

  const handleUseThisPlan = async (id: string) => {
    setLoadingPlanId(id);
    try {
      const res = await fetch(`/api/community/download/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load plan');
      const communityPlan = similarPlans.find(p => p.id === id);
      if (!communityPlan) throw new Error('Plan not found');
      setSelectedTargetLabel(communityPlan.target);
      setSelectedTargetDistance(TARGET_DISTANCES[communityPlan.target] ?? selectedTargetDistance);
      setLevel(communityPlan.level);
      setWeeks(communityPlan.weeks);
      setSelectedDays(sortDays(communityPlan.run_days ?? selectedDays));
      setHrMax(communityPlan.hr_max);
      setPlan(data.plan_data);
      setAppState('output');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleViewSimilarPlan = async (id: string) => {
    setViewingPlanId(id);
    try {
      const res = await fetch(`/api/community/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Not found');
      setViewedCommunityPlan(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setViewingPlanId(null);
    }
  };

  const handleStart = () => {
    setAppState('input');
    setStep(1);
  };

  const STEP_LABELS = ['Goal', 'Details', 'HR Max', 'Review'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={handleReset} className="flex items-center gap-2 cursor-pointer">
            <span className="text-lg">🏃</span>
            <span className="font-bold text-slate-900 text-base hover:text-blue-600">
              WeRunAlone
            </span>
          </button>
          <nav className="flex items-center gap-1 ml-auto">
            <Link href="/community" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Community
            </Link>
            <Link href="/about" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              About
            </Link>
            <Link href="/updates" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              Updates
            </Link>
            <div className="ml-1">
              <WeatherNavBadge />
            </div>
          </nav>
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      step === s
                        ? 'bg-blue-600 text-white'
                        : step > s
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {step > s ? '✓' : s}
                    </div>
                    <span className={`text-xs hidden sm:block ${
                      step === s ? 'text-blue-600 font-medium' : step > s ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{STEP_LABELS[s - 1]}</span>
                  </div>
                  {s < 4 && <div className={`h-px w-8 sm:w-12 mx-1 flex-shrink-0 ${step > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            {appState === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-700 text-sm">
                <span className="font-semibold">Error:</span> {errorMsg}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-6">
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
                  onFindSimilar={handleFindSimilar}
                  finding={findingPlans}
                />
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {appState === 'loading' && (
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-5 py-3.5">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div className="text-left">
                  <div className="text-slate-800 font-medium text-sm">Building your plan...</div>
                  <div className="text-slate-400 text-xs mt-0.5">Usually 15–30 seconds</div>
                </div>
              </div>
            </div>
            <LoadingSkeleton />
          </div>
        )}

        {/* Similar plans */}
        {appState === 'similar' && (
          <div className="max-w-5xl mx-auto px-6">
            <SimilarPlansPanel
              plans={similarPlans}
              loadingId={loadingPlanId}
              viewingId={viewingPlanId}
              onUseThisPlan={handleUseThisPlan}
              onViewPlan={handleViewSimilarPlan}
              onGenerateNew={handleGenerate}
              onBack={() => { setSimilarPlans([]); setAppState('input'); setStep(4); }}
            />
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

        {/* Community plan view modal */}
        {viewedCommunityPlan && (
          <CommunityPlanModal
            plan={viewedCommunityPlan.plan_data}
            planName={viewedCommunityPlan.plan_name}
            sharedBy={viewedCommunityPlan.shared_by}
            target={viewedCommunityPlan.target}
            level={viewedCommunityPlan.level}
            weeks={viewedCommunityPlan.weeks}
            runDays={viewedCommunityPlan.run_days}
            hrMax={viewedCommunityPlan.hr_max}
            onClose={() => setViewedCommunityPlan(null)}
          />
        )}
      </main>

      {/* Token limit / Rate limit modals */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg max-w-sm w-full p-6">
            {modal === 'token_limit' && (
              <>
                <div className="text-2xl mb-3">⚠️</div>
                <h2 className="text-base font-semibold text-slate-900 mb-2">Plan too large to generate</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Your inputs produced a plan that exceeded the AI output limit. Try reducing one or more of these:
                </p>
                <ul className="text-sm text-slate-600 space-y-1 mb-5 list-disc list-inside">
                  <li>Number of weeks (try shorter plan)</li>
                  <li>Number of training days per week</li>
                  <li>Switch from Full/Half Marathon to a shorter distance</li>
                </ul>
                <button
                  onClick={() => setModal(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  Go back and adjust
                </button>
              </>
            )}
            {modal === 'rate_limit' && (
              <>
                <div className="text-2xl mb-3">🚦</div>
                <h2 className="text-base font-semibold text-slate-900 mb-2">Daily limit reached</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  You&apos;ve used all 3 plan generations available for this showcase. The community plans are still available to browse.
                </p>
                <button
                  onClick={() => { setModal(null); setAppState('landing'); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer"
                >
                  Back to home
                </button>
              </>
            )}
            {modal === 'no_similar' && (
              <>
                <div className="text-2xl mb-3">🔍</div>
                <h2 className="text-base font-semibold text-slate-900 mb-2">No similar plans found</h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  We couldn&apos;t find any community plans matching your goal, level, and duration. Would you like to build a new plan from your inputs?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Go back
                  </button>
                  <button
                    onClick={() => { setModal(null); handleGenerate(); }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg cursor-pointer"
                  >
                    Build my plan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {(appState === 'landing' || appState === 'input' || appState === 'error' || appState === 'similar') && (
        <footer className="border-t border-slate-200 py-8 mt-auto">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">WeRunAlone</div>
            <div className="text-xs text-slate-400">Run solo, Run free, Then We Run Alone.</div>
          </div>
        </footer>
      )}
    </div>
  );
}
