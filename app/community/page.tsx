'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { TrainingPlan } from '@/types/plan';
import CommunityPlanModal from '@/components/CommunityPlanModal';
import WeatherNavBadge from '@/components/WeatherNavBadge';

interface CommunityPlan {
  id: string;
  target: string;
  level: string;
  weeks: number;
  run_days: string[];
  hr_max: number | null;
  plan_name: string;
  shared_by: string | null;
  download_count: number;
  created_at: string;
}

interface FullCommunityPlan extends CommunityPlan {
  plan_data: TrainingPlan;
}

const TARGET_OPTIONS = [
  { value: 'All',             label: 'All Targets'              },
  { value: 'Fun Run',         label: '🏃 Fun Run (5 km)'        },
  { value: 'Mini Marathon',   label: '🥈 Mini Marathon (10 km)' },
  { value: 'Half Marathon',   label: '🥇 Half Marathon (21.1 km)'},
  { value: 'Full Marathon',   label: '🏆 Full Marathon (42.2 km)'},
];
const LEVEL_OPTIONS = ['All', 'beginner', 'intermediate'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function PlanCard({
  plan,
  onView,
  loading,
}: {
  plan: CommunityPlan;
  onView: () => void;
  loading: boolean;
}) {
  const levelLabel = plan.level === 'beginner' ? '🌱 Beginner' : '⚡ Experienced';
  const levelColor = plan.level === 'beginner'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : 'bg-orange-50 text-orange-700 ring-orange-200';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3">
      <div>
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2">{plan.plan_name}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs border border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{plan.target}</span>
          <span className={`text-xs border px-2 py-0.5 rounded-md ${levelColor}`}>{levelLabel}</span>
          <span className="text-xs border border-slate-200 bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md">{plan.weeks}w</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto">
        <span>{plan.shared_by ?? 'Anonymous Runner'}</span>
        <span>·</span>
        <span>{plan.download_count} saves</span>
        <span className="ml-auto">{timeAgo(plan.created_at)}</span>
      </div>

      <button
        onClick={onView}
        disabled={loading}
        className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-60"
      >
        {loading ? '…' : 'View Plan'}
      </button>
    </div>
  );
}

export default function CommunityPage() {
  const [plans, setPlans] = useState<CommunityPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterTarget, setFilterTarget] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');

  // Modal
  const [viewPlan, setViewPlan] = useState<FullCommunityPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [filterTarget, filterLevel]);

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterTarget !== 'All') params.set('target', filterTarget);
      if (filterLevel !== 'All') params.set('level', filterLevel);
      const res = await fetch(`/api/community/list?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: string) => {
    setLoadingPlan(id);
    try {
      const res = await fetch(`/api/community/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Not found');
      setViewPlan(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to load plan');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🏃</span>
            <span className="font-bold text-slate-900 text-base hover:text-blue-600">WeRunAlone</span>
          </Link>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-500">Community Plans</span>
          <div className="ml-auto flex items-center gap-3">
            <WeatherNavBadge />
            <Link href="/" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Community Plans</h1>
          <p className="text-sm text-slate-500">Discover training plans shared by other runners</p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter</span>

          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg ring-1 ring-inset ring-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-blue-500 cursor-pointer"
          >
            {TARGET_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg ring-1 ring-inset ring-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-blue-500 cursor-pointer"
          >
            {LEVEL_OPTIONS.map((l) => (
              <option key={l} value={l}>
                {l === 'All' ? 'All Levels' : l === 'beginner' ? '🌱 Beginner' : '⚡ Experienced'}
              </option>
            ))}
          </select>

          {(filterTarget !== 'All' || filterLevel !== 'All') && (
            <button
              onClick={() => { setFilterTarget('All'); setFilterLevel('All'); }}
              className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs text-slate-400">
            {loading ? 'Loading…' : `${plans.length} plan${plans.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 ring-1 ring-inset ring-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl ring-1 ring-inset ring-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-slate-100 rounded mb-2 w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">🏃</p>
            <p className="font-medium text-slate-600 mb-1">No plans yet</p>
            <p className="text-sm">Be the first to share a plan with the community!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onView={() => handleView(plan.id)}
                loading={loadingPlan === plan.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* View plan modal */}
      {viewPlan && (
        <CommunityPlanModal
          plan={viewPlan.plan_data}
          planName={viewPlan.plan_name}
          sharedBy={viewPlan.shared_by}
          target={viewPlan.target}
          level={viewPlan.level}
          weeks={viewPlan.weeks}
          runDays={viewPlan.run_days}
          hrMax={viewPlan.hr_max}
          onClose={() => setViewPlan(null)}
        />
      )}
    </div>
  );
}
