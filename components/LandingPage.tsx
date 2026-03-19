'use client';

import Link from 'next/link';
import WeatherWidget from './WeatherWidget';

const RUN_TYPES = [
  {
    name: 'Easy Run',
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
    labelColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    zone: 'Zone 1–2',
    heart: '60–70% HRmax',
    summary: 'The most common session in your plan. Run slow enough that you can hold a full conversation without gasping — if it feels embarrassingly slow, it\'s probably right.',
    feeling: 'You should feel like you could run much further. Nasal breathing is possible. Never breathless.',
    builds: 'Aerobic base, fat metabolism efficiency, active recovery between hard sessions. The majority of your weekly kilometres should be Easy Runs.',
    tip: '💡 Most runners run easy days too fast. Slowing down here is what makes hard days actually hard — and keeps you injury-free.',
  },
  {
    name: 'Long Run',
    border: 'border-l-sky-400',
    bg: 'bg-sky-50',
    dot: 'bg-sky-500',
    labelColor: 'text-sky-700',
    badgeBg: 'bg-sky-100 text-sky-700',
    zone: 'Zone 2',
    heart: '65–75% HRmax',
    summary: 'Your longest run of the week — done at a relaxed, steady pace, slower than race pace. Distance increases gradually each phase to build your endurance ceiling.',
    feeling: 'Comfortable but purposeful. You should finish tired but not destroyed. If you\'re struggling in the last 20%, slow down.',
    builds: 'Mitochondrial density, glycogen storage capacity, fat-burning efficiency, and the mental resilience to keep going when tired.',
    tip: '💡 Run it too fast and you turn a base-building session into junk miles. The goal is time on feet, not speed.',
  },
  {
    name: 'Tempo Run',
    border: 'border-l-orange-400',
    bg: 'bg-orange-50',
    dot: 'bg-orange-500',
    labelColor: 'text-orange-700',
    badgeBg: 'bg-orange-100 text-orange-700',
    zone: 'Zone 3–4',
    heart: '80–90% HRmax',
    summary: '"Comfortably hard" — the pace you could sustain for roughly one hour in a race. Typically done for 20–40 continuous minutes after a warm-up.',
    feeling: 'You can speak a few words but not hold a conversation. Breathing is rhythmic and controlled. It hurts, but it\'s sustainable.',
    builds: 'Lactate threshold — the point where lactic acid accumulates faster than your body can clear it. A higher threshold means a faster race pace.',
    tip: '💡 This is the most direct training signal for race performance. Getting comfortable at this effort directly translates to running your goal distance faster.',
  },
  {
    name: 'Interval Run',
    border: 'border-l-red-400',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
    labelColor: 'text-red-700',
    badgeBg: 'bg-red-100 text-red-700',
    zone: 'Zone 4–5',
    heart: '90–100% HRmax',
    summary: 'Short, very fast repetitions with full recovery between each. A typical session might be 400 m × 6–8 reps, or 1 km × 4 reps with 90 s rest.',
    feeling: 'Each rep should feel hard enough that you need to focus on form. Breathing is laboured. The last rep should feel as hard as the first.',
    builds: 'VO₂max (your body\'s maximum oxygen uptake), running economy, leg speed, and fast-twitch muscle recruitment.',
    tip: '💡 The recovery between reps is part of the session — don\'t cut it short. Full recovery lets you run each rep at true quality, which is the whole point.',
  },
  {
    name: 'Hill Repeat',
    border: 'border-l-purple-400',
    bg: 'bg-purple-50',
    dot: 'bg-purple-500',
    labelColor: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-700',
    zone: 'Zone 4',
    heart: '85–95% HRmax',
    summary: 'Sprint hard uphill for 60–90 seconds, then jog slowly back down to recover. Repeat 6–8 times. A short but brutally effective session.',
    feeling: 'Legs burn on the way up, controlled and easy on the way down. Drive your arms, shorten your stride, stay tall.',
    builds: 'Glute and calf power, running form under fatigue, injury resilience (less impact than flat sprints), and mental toughness.',
    tip: '💡 Hills are speed work in disguise. The incline forces good mechanics and reduces ground impact — making it safer and more effective than flat sprinting.',
  },
];

const RACE_GOALS = [
  {
    icon: '🏃',
    name: 'Fun Run',
    distance: '5 km',
    borderColor: 'border-emerald-200',
    weeks: '4–12 weeks',
    desc: 'Perfect entry point. Short enough to be accessible, long enough to feel proud.',
    training: 'Easy Run · Light Strength · 3 days/week',
  },
  {
    icon: '🥈',
    name: 'Mini Marathon',
    distance: '10 km',
    borderColor: 'border-blue-200',
    weeks: '8–20 weeks',
    desc: 'The first real test of aerobic base. Demands consistency and some speed work.',
    training: 'Easy + Tempo · Strength · 3–4 days/week',
  },
  {
    icon: '🥇',
    name: 'Half Marathon',
    distance: '21.1 km',
    borderColor: 'border-amber-200',
    weeks: '12–24 weeks',
    desc: 'A serious distance that rewards structured training. Long runs are essential.',
    training: 'All run types · Strength + Plyo · 4–5 days/week',
  },
  {
    icon: '🏆',
    name: 'Full Marathon',
    distance: '42.2 km',
    borderColor: 'border-rose-200',
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
      <section className="pt-4 space-y-5 text-center">
        <p className="text-sm text-blue-600 font-medium">Free training plans for runners</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
          Run solo, run free.<br />
          <span className="text-blue-600">We Run Alone.</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
          Tell us your goal, your schedule, and your heart rate max — we'll build a plan that actually fits your life.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm cursor-pointer"
          >
            Build my plan →
          </button>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm"
          >
            Browse community plans
          </Link>
        </div>
        <p className="text-xs text-slate-400">No account needed · takes about 2 minutes</p>

        <WeatherWidget />
      </section>

      {/* What's in a plan */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">What goes into a plan</h2>
        <p className="text-sm text-slate-500 mb-6">Every plan balances three types of training</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🏃', label: 'Running', desc: 'Varied run types that build aerobic base, speed, and endurance over time.' },
            { icon: '🏋️', label: 'Strength', desc: 'Runner-specific exercises to prevent injury and build power in the right muscles.' },
            { icon: '⚡', label: 'Plyometrics', desc: 'Jump training that improves running economy and explosive stride.' },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="font-semibold text-slate-900 text-sm mb-1.5">{item.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Run Types */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Run types explained</h2>
        <p className="text-sm text-slate-500 mb-6">Your plan mixes these based on your goal and training phase — here&apos;s what each one means and why it matters</p>
        <div className="space-y-4">
          {RUN_TYPES.map((rt) => (
            <div key={rt.name} className={`rounded-xl border border-slate-200 border-l-4 ${rt.border} ${rt.bg} p-5`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${rt.dot}`} />
                  <span className={`font-bold text-sm ${rt.labelColor}`}>{rt.name}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${rt.badgeBg}`}>{rt.zone}</span>
                <span className="text-xs text-slate-400">{rt.heart}</span>
              </div>

              {/* Summary */}
              <p className="text-sm text-slate-700 leading-relaxed mb-3">{rt.summary}</p>

              {/* Grid: feeling + builds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="bg-white/60 rounded-lg px-3 py-2.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">How it feels</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rt.feeling}</p>
                </div>
                <div className="bg-white/60 rounded-lg px-3 py-2.5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">What it builds</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rt.builds}</p>
                </div>
              </div>

              {/* Tip */}
              <p className={`text-xs leading-relaxed ${rt.labelColor} opacity-80`}>{rt.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Race Distances */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">Pick your distance</h2>
        <p className="text-sm text-slate-500 mb-6">Your plan adapts to the race you're training for</p>
        <div className="grid grid-cols-2 gap-3">
          {RACE_GOALS.map((rg) => (
            <div key={rg.name} className={`bg-white rounded-xl border ${rg.borderColor} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{rg.icon}</span>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{rg.name}</div>
                  <div className="text-lg font-bold text-slate-700 leading-none">{rg.distance}</div>
                </div>
                <div className="ml-auto text-xs text-slate-400">{rg.weeks}</div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-2">{rg.desc}</p>
              <p className="text-xs text-slate-400">{rg.training}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example Plan Preview */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">What the output looks like</h2>
        <p className="text-sm text-slate-500 mb-6">Sample: 12-week Mini Marathon plan, beginner</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            { phase: 'Phase 1', name: 'Base Building', weeks: 'Weeks 1–4', leftBorder: 'border-l-blue-400' },
            { phase: 'Phase 2', name: 'Development',   weeks: 'Weeks 5–10', leftBorder: 'border-l-violet-400' },
            { phase: 'Phase 3', name: 'Taper & Race',  weeks: 'Weeks 11–12', leftBorder: 'border-l-emerald-400' },
          ].map((p) => (
            <div key={p.phase} className={`bg-white border border-slate-200 border-l-4 ${p.leftBorder} rounded-xl px-4 py-3`}>
              <div className="text-xs text-slate-400 mb-1">{p.phase}</div>
              <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{p.weeks}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs text-slate-400 mb-4">Sample week (Phase 1 — repeats each week in the phase)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { day: 'Monday',    type: 'Easy Run',  detail: '5 km · Zone 2',       border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'text-emerald-700' },
              { day: 'Wednesday', type: 'Strength',  detail: '40 min · 5 exercises', border: 'border-violet-200',  dot: 'bg-violet-500',  label: 'text-violet-700'  },
              { day: 'Friday',    type: 'Easy Run',  detail: '6 km · Zone 2',       border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'text-emerald-700' },
              { day: 'Sunday',    type: 'Long Run',  detail: '10 km · Zone 2',      border: 'border-sky-200',     dot: 'bg-sky-500',     label: 'text-sky-700'     },
            ].map((item) => (
              <div key={item.day} className={`rounded-lg border ${item.border} bg-white p-3`}>
                <div className="text-xs text-slate-400 mb-2">{item.day}</div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                  <span className={`text-xs font-semibold ${item.label}`}>{item.type}</span>
                </div>
                <div className="text-xs text-slate-500">{item.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>Distance increases each phase</span>
            <span>·</span>
            <span>Paces calibrated to your HR Max</span>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-8 border-t border-slate-200 pt-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Ready to start?</h2>
        <p className="text-sm text-slate-500 mb-5">Builds in about 20–30 seconds. Free, no login required.</p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm cursor-pointer"
        >
          Build my plan →
        </button>
      </section>
    </div>
  );
}
