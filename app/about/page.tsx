import Link from 'next/link';
import WeatherNavBadge from '@/components/WeatherNavBadge';

const NAV_LINKS = [
  { href: '/community', label: 'Community' },
  { href: '/about',     label: 'About'     },
  { href: '/updates',   label: 'Updates'   },
];

const STACK = [
  { name: 'Next.js 14 App Router', role: 'Framework — file-based routing, server components, API routes', color: 'bg-slate-100 text-slate-700' },
  { name: 'TypeScript',            role: 'Type safety across the entire codebase',                        color: 'bg-blue-50 text-blue-700'   },
  { name: 'Tailwind CSS',          role: 'Utility-first styling — no CSS modules or styled-components',   color: 'bg-sky-50 text-sky-700'     },
  { name: 'Anthropic Claude API',  role: 'claude-sonnet-4-6 — generates the full training plan as JSON', color: 'bg-orange-50 text-orange-700'},
  { name: 'Supabase',              role: 'PostgreSQL DB — stores and serves community-shared plans',      color: 'bg-emerald-50 text-emerald-700' },
  { name: 'html-to-image',         role: 'Captures the plan as a PNG for download / sharing',            color: 'bg-violet-50 text-violet-700'   },
  { name: 'Open-Meteo',            role: 'Free weather API — no key required, feeds the weather widget', color: 'bg-teal-50 text-teal-700'   },
  { name: 'WAQI',                  role: 'Air quality index — proxied server-side to keep the token hidden', color: 'bg-rose-50 text-rose-700' },
];

const FLOW = [
  {
    step: 1,
    title: 'Goal',
    desc: 'Pick a race distance (Fun Run · Mini Marathon · Half · Full), set a target finish time, and get a live pace preview.',
    color: 'bg-blue-600',
  },
  {
    step: 2,
    title: 'Details',
    desc: 'Choose beginner or experienced, set training weeks and days per week, and enter your running background (PBs or race history).',
    color: 'bg-blue-600',
  },
  {
    step: 3,
    title: 'HR Max',
    desc: 'Enter your heart rate maximum. Every training pace in the plan is derived from this number using zone formulas.',
    color: 'bg-blue-600',
  },
  {
    step: 4,
    title: 'Review & Build',
    desc: 'Confirm your inputs. The app first searches community plans for a match. If found you can use one instantly — no AI cost. If not, Claude generates your personalised plan.',
    color: 'bg-blue-600',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🏃</span>
            <span className="font-bold text-slate-900 text-base hover:text-blue-600">WeRunAlone</span>
          </Link>
          <nav className="flex items-center gap-1 ml-auto">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  l.href === '/about'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="ml-2">
              <WeatherNavBadge />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 space-y-14">

        {/* Hero */}
        <section>
          <span className="inline-flex items-center text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-4">
            About
          </span>
          <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-4">What is WeRunAlone?</h1>
          <p className="text-slate-600 leading-relaxed max-w-2xl">
            WeRunAlone is a free, no-login AI training plan generator for runners. Tell it your race goal,
            experience level, weekly schedule, and heart rate max — it builds a structured, periodised plan
            in 15–30 seconds using Claude AI. Plans can be exported as an image or shared with the community
            so others can discover and reuse them.
          </p>
        </section>

        {/* Objective */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Objective</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: '🎯', title: 'Personalised',  desc: 'Every plan is built around your finish-time goal, HR Max, experience, and weekly availability — not a generic template.'  },
              { icon: '💸', title: 'Completely free', desc: 'No account, no paywall, no ads. Just enter your details and get a plan. Community plans are free to browse and download.' },
              { icon: '🤝', title: 'Community first', desc: 'Plans generated here are shareable. Before spending AI tokens, the app checks if a matching plan already exists in the community.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="font-semibold text-slate-900 text-sm mb-1.5">{item.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">How it works</h2>
          <p className="text-sm text-slate-500 mb-6">4 steps to a personalised plan</p>
          <div className="space-y-3">
            {FLOW.map((f) => (
              <div key={f.step} className="flex gap-4 bg-white border border-slate-200 rounded-xl p-4">
                <div className={`w-7 h-7 rounded-full ${f.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {f.step}
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm mb-0.5">{f.title}</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <div className="font-semibold text-emerald-800 text-sm mb-0.5">Output</div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  View your full periodised plan with warmup/cooldown sessions, pace targets, HR zones, and
                  exercise lists. Export as PNG or share to the community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Tech stack</h2>
          <p className="text-sm text-slate-500 mb-6">What the app is built with</p>
          <div className="space-y-2">
            {STACK.map((s) => (
              <div key={s.name} className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${s.color}`}>
                  {s.name}
                </span>
                <span className="text-sm text-slate-500 leading-snug">{s.role}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Claude Skill download */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Use it with your own Claude</h2>
          <p className="text-sm text-slate-500 mb-6">
            Take the same coaching logic to Claude.ai — no app needed
          </p>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="flex-1">
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Download the <strong>WeRunAlone Skill</strong> — a ready-made instruction file you paste into
                  any Claude Project. Claude will guide you through the same 4-step flow and generate
                  a full periodised plan directly in your chat, using the same coaching rules, volume
                  targets, and pace zones as this app.
                </p>
                <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                  <li>Download the file below</li>
                  <li>Go to <span className="font-medium text-slate-700">claude.ai → Projects → Project instructions</span></li>
                  <li>Paste the entire file contents and save</li>
                  <li>Start a new chat inside that project — Claude is now your running coach</li>
                </ol>
              </div>
              <a
                href="/SKILL.md"
                download="WeRunAlone-Skill.md"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex-shrink-0 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Skill
              </a>
            </div>
          </div>
        </section>

        {/* Architecture callouts */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Key design decisions</h2>
          <p className="text-sm text-slate-500 mb-6">Choices made to keep the app fast, cheap, and maintainable</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Community-first',       desc: 'Checks community plans before calling Claude. Zero AI cost if a matching plan exists.' },
              { title: 'Server-injected warmup', desc: 'Warmup/cooldown is not generated by AI — static templates are injected after parsing, saving ~15% output tokens.' },
              { title: 'All limits in one file', desc: 'Generation limit, share limit, and token cap all live in lib/config.ts. One edit, everywhere updates.' },
              { title: 'All state in one place', desc: 'page.tsx owns every form field. Child components are fully controlled — easy to reason about and debug.' },
              { title: 'No CSS modules',         desc: 'Tailwind utility classes only. PlanExportView uses inline hex colours so html-to-image captures them correctly.' },
              { title: 'Rate limiting server-side', desc: 'Supabase service-role key is only used in API routes. Clients cannot bypass rate limits with direct DB calls.' },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="font-semibold text-slate-900 text-sm mb-1">— {item.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">WeRunAlone</div>
          <div className="text-xs text-slate-400">Run solo, Run free, Then We Run Alone.</div>
        </div>
      </footer>
    </div>
  );
}
