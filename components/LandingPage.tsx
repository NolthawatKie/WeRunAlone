'use client';

import Link from 'next/link';
import WeatherWidget from './WeatherWidget';

const RUN_TYPES = [
  {
    name: 'Easy Run',
    color: 'border-emerald-300 bg-emerald-50',
    dot: 'bg-emerald-500',
    labelColor: 'text-emerald-700',
    zone: 'Zone 1–2',
    heart: '60–70% HRmax',
    summary: 'Conversational pace — you can hold a full sentence.',
    use: 'Recovery, base building, long aerobic sessions',
  },
  {
    name: 'Long Run',
    color: 'border-sky-300 bg-sky-50',
    dot: 'bg-sky-500',
    labelColor: 'text-sky-700',
    zone: 'Zone 2',
    heart: '65–75% HRmax',
    summary: 'Slow & steady — the cornerstone of endurance.',
    use: 'Weekly longest run, builds aerobic capacity',
  },
  {
    name: 'Tempo Run',
    color: 'border-orange-300 bg-orange-50',
    dot: 'bg-orange-500',
    labelColor: 'text-orange-700',
    zone: 'Zone 3–4',
    heart: '80–90% HRmax',
    summary: '"Comfortably hard" — tough but sustainable for 20–40 min.',
    use: 'Raises lactate threshold, improves race pace',
  },
  {
    name: 'Interval Run',
    color: 'border-red-300 bg-red-50',
    dot: 'bg-red-500',
    labelColor: 'text-red-700',
    zone: 'Zone 4–5',
    heart: '90–100% HRmax',
    summary: 'Short fast bursts with recovery — e.g. 400 m × 6 reps.',
    use: 'Boosts VO₂max, speed, and running economy',
  },
  {
    name: 'Hill Repeat',
    color: 'border-purple-300 bg-purple-50',
    dot: 'bg-purple-500',
    labelColor: 'text-purple-700',
    zone: 'Zone 4',
    heart: '85–95% HRmax',
    summary: 'Sprint uphill 60–90 s × 6–8 reps, jog down to recover.',
    use: 'Builds leg power, form, and injury resilience',
  },
];

const RACE_GOALS = [
  {
    icon: '🏃',
    name: 'Fun Run',
    distance: '5 km',
    accent: 'border-emerald-300',
    bg: 'bg-emerald-50',
    weeks: '4–12 weeks',
    desc: 'Perfect entry point. Short enough to be accessible, long enough to feel proud.',
    training: 'Easy Run · Light Strength · 3 days/week',
  },
  {
    icon: '🥈',
    name: 'Mini Marathon',
    distance: '10 km',
    accent: 'border-blue-300',
    bg: 'bg-blue-50',
    weeks: '8–20 weeks',
    desc: 'The first real test of aerobic base. Demands consistency and some speed work.',
    training: 'Easy + Tempo · Strength · 3–4 days/week',
  },
  {
    icon: '🥇',
    name: 'Half Marathon',
    distance: '21.1 km',
    accent: 'border-amber-300',
    bg: 'bg-amber-50',
    weeks: '12–24 weeks',
    desc: 'A serious distance that rewards structured training. Long runs are essential.',
    training: 'All run types · Strength + Plyo · 4–5 days/week',
  },
  {
    icon: '🏆',
    name: 'Full Marathon',
    distance: '42.2 km',
    accent: 'border-rose-300',
    bg: 'bg-rose-50',
    weeks: '16–30 weeks',
    desc: 'The ultimate test. Requires a periodised plan, taper, and race-day strategy.',
    training: 'Full periodisation · Strength · 5+ days/week',
  },
];

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full">
          AI-Powered Running Coach
        </div>
        <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
          Run solo, Run free.<br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            We Run Alone.
          </span>
        </h1>
        <p className="text-slate-600 text-lg max-w-xl mx-auto leading-relaxed">
          WeRunAlone builds a personalised training plan — balancing runs, strength, and plyometrics — based on your goal and schedule.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            🏃 Build My Training Plan →
          </button>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base px-6 py-4 rounded-2xl ring-1 ring-inset ring-slate-200 hover:ring-slate-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            🌍 Explore Community Plans
          </Link>
        </div>

        <WeatherWidget />
      </section>

      {/* Training Philosophy */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">What goes into a complete plan</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🏃', color: 'bg-blue-50 border-blue-200', label: 'Running', desc: 'Aerobic base, speed, and endurance through varied run types' },
            { icon: '🏋️', color: 'bg-violet-50 border-violet-200', label: 'Strength', desc: 'Injury prevention and power from runner-specific weight training' },
            { icon: '⚡', color: 'bg-amber-50 border-amber-200', label: 'Plyometrics', desc: 'Running economy and explosive power through jump training' },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border p-5 text-center ${item.color}`}>
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="font-bold text-slate-900 mb-2">{item.label}</div>
              <div className="text-xs text-slate-600 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Run Types */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Run types explained</h2>
          <p className="text-slate-500 text-sm mt-1">Your plan will use the right mix depending on your goal and phase</p>
        </div>
        <div className="space-y-3">
          {RUN_TYPES.map((rt) => (
            <div key={rt.name} className={`rounded-2xl border p-5 ${rt.color}`}>
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 w-40 flex-shrink-0 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rt.dot}`} />
                  <span className={`font-bold text-sm ${rt.labelColor}`}>{rt.name}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{rt.summary}</p>
                  <p className="text-xs text-slate-500 mt-1">{rt.use}</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className={`text-xs font-semibold ${rt.labelColor}`}>{rt.zone}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{rt.heart}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Race Distances */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Race distances</h2>
          <p className="text-slate-500 text-sm mt-1">Pick one — your plan adapts to it automatically</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {RACE_GOALS.map((rg) => (
            <div key={rg.name} className={`rounded-2xl border p-5 ${rg.accent} ${rg.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{rg.icon}</span>
                <div>
                  <div className="font-bold text-slate-900">{rg.name}</div>
                  <div className="text-xl font-black text-slate-700 leading-none">{rg.distance}</div>
                </div>
                <div className="ml-auto text-xs text-slate-500 text-right">
                  {rg.weeks}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{rg.desc}</p>
              <p className="text-xs text-slate-500">{rg.training}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example Plan Preview */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">What your plan looks like</h2>
          <p className="text-slate-500 text-sm mt-1">Sample 12-week Mini Marathon (10 km) plan — Beginner</p>
        </div>

        {/* Phase structure */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { phase: 'Phase 1', name: 'Base Building', weeks: 'Weeks 1–4', color: 'border-l-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
            { phase: 'Phase 2', name: 'Development',   weeks: 'Weeks 5–10', color: 'border-l-purple-400', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
            { phase: 'Phase 3', name: 'Taper & Race',  weeks: 'Weeks 11–12', color: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          ].map((p) => (
            <div key={p.phase} className={`bg-white border border-slate-200 border-l-4 ${p.color} rounded-xl px-4 py-3`}>
              <div className={`text-xs font-bold uppercase tracking-widest border px-2 py-0.5 rounded-full inline-block mb-1.5 ${p.badge}`}>{p.phase}</div>
              <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{p.weeks}</div>
            </div>
          ))}
        </div>

        {/* Sample week pattern */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Sample week — Phase 1 (repeated 4 times)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { day: 'Monday',    type: 'Easy Run',  detail: '5 km · Zone 2',      color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'text-emerald-700' },
              { day: 'Wednesday', type: 'Strength',  detail: '40 min · 5 exercises', color: 'bg-violet-50 border-violet-200',  dot: 'bg-violet-500',  label: 'text-violet-700' },
              { day: 'Friday',    type: 'Easy Run',  detail: '6 km · Zone 2',      color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'text-emerald-700' },
              { day: 'Sunday',    type: 'Long Run',  detail: '10 km · Zone 2',     color: 'bg-sky-50 border-sky-200',         dot: 'bg-sky-500',     label: 'text-sky-700'     },
            ].map((item) => (
              <div key={item.day} className={`rounded-xl border p-3 ${item.color}`}>
                <div className="text-xs font-semibold text-slate-500 mb-2">{item.day}</div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                  <span className={`text-xs font-bold ${item.label}`}>{item.type}</span>
                </div>
                <div className="text-xs text-slate-500">{item.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
            <span>🔁 Pattern repeats each week in the phase</span>
            <span>·</span>
            <span>📏 Distance increases each phase</span>
            <span>·</span>
            <span>❤️ Paces calibrated to your HR Max</span>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center pb-8">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
        >
          🏃 Build My Training Plan →
        </button>
        <p className="text-slate-400 text-xs mt-4">Free · No account needed</p>
      </section>
    </div>
  );
}
