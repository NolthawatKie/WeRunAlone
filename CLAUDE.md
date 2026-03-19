# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (type-checks + compiles)
npm run lint     # ESLint via next lint
npm run start    # Run production build
```

No test suite is configured. Verify changes visually via the dev server.

## Environment

Requires `.env.local` at the project root (not committed to git):
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WAQI_TOKEN=...
```

**Never commit `.env.local`** — it is in `.gitignore`. For deployment, set these as environment variables in the hosting platform (Vercel dashboard → Settings → Environment Variables).

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Anthropic Claude API (`claude-sonnet-4-6`) · Supabase (community plans DB) · `html-to-image` for PNG export

**Theme:** Light blue — `bg-slate-50` body, `bg-white` cards, `border-slate-200` borders, `bg-blue-600` primary CTAs. No gradients, no `hover:scale`, no `rounded-2xl`. Solid `bg-white` header (no `backdrop-blur`). The `globals.css` intentionally does NOT set background/color on `html, body`; those come from `layout.tsx` body class.

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Main app — landing + 4-step form + similar plans + plan output |
| `/community` | `app/community/page.tsx` | Browse & view shared community plans |

### Data flow

```
app/page.tsx (all state lives here)
  ├── LandingPage          — hero + "Build My Plan" + "Browse community plans" + WeatherWidget
  ├── StepOne              — target selection → passes (id, label, distance, weekConfig, minDays)
  ├── StepTwo              — level + experience + weeks + days
  │     ├── beginner sub-form: "Never run before" toggle OR optional PB (distance + time)
  │     └── experienced sub-form: race history (4 distance checkboxes, count stepper, PR, actualDistance for Under 10km)
  ├── StepThree            — HR Max (required — blocks progression if empty)
  ├── StepFour             — review inputs → "Find Similar Plans" button
  ├── SimilarPlansPanel    — shows up to 3 matching community plans; "Use This Plan" or "Generate New Plan"
  ├── LoadingSkeleton      — shown during AI call
  └── OutputPlan           — renders plan + PNG export + "Share to Community" button
        ├── POST /api/generate → Claude API → inject warmup/cooldown → JSON plan
        └── POST /api/community/save → Supabase community_plans table

app/community/page.tsx
  └── CommunityPlanModal   — full plan view + PNG export
        ├── GET /api/community/list?target&level&weeksNear
        ├── GET /api/community/[id]
        └── POST /api/community/download/[id]
```

### Similar plans flow

StepFour's "Find Similar Plans" button triggers `handleFindSimilar` in `page.tsx`:
1. Queries `GET /api/community/list?target=...&level=...&weeksNear=N` (returns plans with `weeks BETWEEN N-2 AND N+2`, ordered by `download_count DESC`, limit 3)
2. If results → `appState = 'similar'` → shows `SimilarPlansPanel`
3. If no results → falls through directly to `handleGenerate` (no user friction)

From `SimilarPlansPanel`:
- **"Use This Plan"** → `POST /api/community/download/{id}` (increments download_count, returns plan_data) → sets plan state → `appState = 'output'`
- **"View Plan"** → `GET /api/community/{id}` → opens `CommunityPlanModal` (read-only)
- **"Generate New Plan"** → calls `handleGenerate` as normal

### Weather widget system

- **`WeatherWidget`** (`components/WeatherWidget.tsx`) — full widget shown on landing page
  - Fetches: browser Geolocation → Open-Meteo (weather) + `/api/aqi` proxy (WAQI) + Nominatim (city name) in parallel
  - Heat index formula: `heatIndex = temperature + (humidity - 40) * 0.15`
  - Scoring: deducts points for heat index (5 tiers), weather code, wind, precipitation, AQI (7 tiers)
  - After fetch, writes score snapshot to `sessionStorage('arundia_run_score')` and fires `window.dispatchEvent(new Event('arundia_weather_ready'))`

- **`WeatherNavBadge`** (`components/WeatherNavBadge.tsx`) — compact emoji+label in every page header
  - Reads from `sessionStorage` on mount; listens for `arundia_weather_ready` event
  - Zero extra network requests — reuses data written by WeatherWidget
  - Present in **both** `app/page.tsx` and `app/community/page.tsx` headers

- **`/api/aqi`** (`app/api/aqi/route.ts`) — server-side WAQI proxy (keeps token secret)
  - Returns `{ aqi, pm25, station }` or `{ aqi: null }` if `WAQI_TOKEN` env var missing
  - `next: { revalidate: 600 }` — 10-minute cache

### Community feature

**Supabase tables:**

`community_plans`
- `id` uuid PK · `target` text · `level` text · `weeks` int · `run_days` text[] · `hr_max` int
- `plan_data` jsonb · `plan_name` text · `shared_by` text (nullable) · `download_count` int default 0 · `created_at` timestamp

`share_rate_limit`
- `id` uuid PK · `ip` text · `count` int default 1 · `date` date default current_date
- Dual-purpose: plan generation rows use `ip = "generate:{ip}"` (no date filter, lifetime count); sharing rows use `ip = "{ip}"` (date-filtered, resets daily)

**RLS policies (applied in Supabase):**
- `community_plans`: anon SELECT only; service_role INSERT + UPDATE; no DELETE policy
- `share_rate_limit`: service_role all; anon no access
- All writes go through server-side API routes (using `SUPABASE_SERVICE_ROLE_KEY`) — users cannot bypass rate limiting via direct Supabase calls

**Rate limits** — all limits are defined in `lib/config.ts` (`LIMITS` object). Edit that file to change any limit without touching business logic.
- Plan generation: max `LIMITS.PLAN_GENERATIONS_PER_IP` (default 3) per IP **lifetime**, enforced in `/api/generate`. Key `generate:{ip}`, no date filter.
- Community sharing: max `LIMITS.COMMUNITY_SHARES_PER_DAY` (default 3) per IP **per day**, enforced in `/api/community/save`. Key `{ip}` + date filter.

**Target values stored in DB** (must match exactly for filter to work):
`'Fun Run'` · `'Mini Marathon'` · `'Half Marathon'` · `'Full Marathon'`
These come from StepOne's `label` field — do NOT include the distance suffix.

### Warmup / cooldown templates (`lib/workout-templates.ts`)

Warmup and cooldown sessions are **not generated by Claude**. The prompt instructs Claude to omit them entirely. After the AI response is parsed, `injectWarmupCooldown()` in the generate route:
1. Strips any warmup/cooldown Claude may have hallucinated
2. Looks at each day's sessions for intense run types (Tempo Run, Interval Run, Hill Repeat) OR Long Run with duration > 60 min
3. Prepends a `warmup` session and appends a `cooldown` session from the static template

Templates are defined in `lib/workout-templates.ts` as 8 combinations (4 targets × 2 levels):
- `fun_run_beginner` · `fun_run_intermediate`
- `mini_marathon_beginner` · `mini_marathon_intermediate`
- `half_marathon_beginner` · `half_marathon_intermediate`
- `full_marathon_beginner` · `full_marathon_intermediate`

`getWorkoutTemplate(targetLabel, level)` maps e.g. `'Half Marathon'` + `'beginner'` → `half_marathon_beginner`. Falls back to `fun_run_beginner` if key not found.

### Plan data model (`types/plan.ts`)

```
TrainingPlan
  phases: Phase[]
    repeatWeeks: number          ← same week pattern repeated N times
    days: Day[]
      type: run | strength | plyometrics | rest
      sessions: Session[]
        type: warmup | run | strength | plyometrics | cooldown | rest
        runType?: "Easy Run" | "Long Run" | "Tempo Run" | "Interval Run" | "Hill Repeat"
        exercises?: Exercise[]   ← for strength / plyometrics / warmup / cooldown

RaceEntry { distance, label, count, prH, prM, actualDistance? }
  ← prH/prM replace the old pr string — 0h 00m means no PR entered
  ← actualDistance only for "Under 10 km" — stores the specific km the user raced
```

`WeekConfig` (`{ min, max, default, warnBelow }`) is per-target and controls the weeks slider in StepTwo. A `minDays` value (per target) is also passed from StepOne to enforce minimum training days.

### Form flow (4 steps)

| Step | Component   | Key state collected |
|------|-------------|---------------------|
| 1    | StepOne     | `target`, `targetLabel`, `targetDistance`, `weekConfig`, `minDays`, `targetTimeH`, `targetTimeM` |
| 2    | StepTwo     | `level`, `weeks`, `selectedDays`, `neverRunBefore`, `pbDistance`, `pbTimeH`, `pbTimeM`, `raceHistory` |
| 3    | StepThree   | `hrMax` (required) |
| 4    | StepFour    | review only — triggers `handleFindSimilar` → similar plans or generate |

All state lives in `page.tsx`. Step indicator shows `['Goal', 'Details', 'HR Max', 'Review']`.

**Target time** (StepOne): Required before proceeding. Shown as H+MM dropdowns with:
- Quick preset chips per target (e.g. Sub 1:30 / Sub 2:00 for Half Marathon)
- Computed average pace displayed live (e.g. `5:41 min/km`)
- Validation: blocks Next if time is 0 or below `minTotalMin` (world-record threshold)
- Defaults reset automatically when the user switches race target

**Time inputs (StepTwo)**: All time fields use the `TimeInput` component (H + MM selects) instead of free text:
- Beginner PB time: `pbTimeH` + `pbTimeM` (0h 00m = no PB)
- Experienced race PR per entry: `prH` + `prM` on `RaceEntry` (0h 00m = no PR)

### API route (`app/api/generate/route.ts`)

Single `POST /api/generate` handler. Receives and uses:
- `targetLabel`, `targetDistance`, `level`, `weeks`, `days`, `hrMax`
- `targetTimeH`, `targetTimeM`, `targetTimeTotalMin` — finish time goal; computed avg pace added to prompt
- `neverRunBefore`, `pbDistance`, `pbTime` — beginner runner background
- `raceHistory: RaceEntry[]` — experienced runner background (prH/prM composed to "H:MM:00" string in prompt)

Builds a structured prompt with labelled sections including:
- `RUNNER PROFILE` — goal, level, background, HR zones, target time + race pace
- `VOLUME TARGETS` — server-computed per-phase long run km, easy run km, weekly total km (derived from `getVolumeGuide()` by target distance × level)
- `TRAINING PACES` — all 5 run-type paces computed from target race pace via `getPaceZones()` (easy +75s, long run +60s, tempo +15s, interval −15s, hill −10s)
- `PLAN STRUCTURE` — phase count, taper config (0/1/2/3 taper weeks for Fun/Mini/Half/Full)
- `DAILY RULES` — per-day type balance; explicitly instructs Claude NOT to include warmup/cooldown
- Dynamic JSON schema example using actual user days + realistic distances from volume guide

Key server-side computations (`route.ts`):
- `getVolumeGuide(targetDistance, isBeginner)` — returns `longRunStart`, `longRunPeak`, `easyRunBase`, `easyRunPeak`, `weeklyKmBase`, `weeklyKmPeak`
- `phaseVolumeNotes(...)` — generates per-phase distance targets interpolated between start and peak
- `getPaceZones(racePaceMinKm)` — derives all 5 training paces from race target pace
- `injectWarmupCooldown(plan, template)` — strips AI warmup/cooldown, injects static template for intense sessions
- `parsePaceSec` / `formatPaceStr` — pace string utilities

Returns **raw JSON only** (no markdown). Markdown fences stripped before `JSON.parse`. Response is validated — throws if any phase has no `days`. Up to 3 retry attempts on parse failure.

Model: `claude-sonnet-4-6`, `max_tokens: LIMITS.MAX_OUTPUT_TOKENS` (default 14,000).

**Error handling in generate API:**
- `stop_reason === 'max_tokens'` → returns `{ error: 'TOKEN_LIMIT' }` status 422 immediately (no retry). Frontend shows a modal telling user to reduce weeks/days/distance.
- Rate limit exceeded → returns `{ error: 'RATE_LIMIT' }` status 429. Frontend shows a modal explaining the lifetime limit.
- Both modal types rendered in `app/page.tsx` via `modal: ModalType` state (`'token_limit' | 'rate_limit' | null`).

**Cost profile** (realistic plans use 750–3,500 output tokens; warmup/cooldown excluded from AI output):
- Min (Fun Run, 4w, 3 days): ~$0.013/call
- Typical (Half Marathon, 16w, 5 days): ~$0.041/call
- Max realistic (Full Marathon, 30w, 7 days): ~$0.050/call
- Token limit hit (14k): ~$0.213/call

### Key design decisions

- **Similar plans before generation** — StepFour queries community plans matching target + level + ±2 weeks before calling Claude. Zero AI cost if user picks a community plan. If no matches, falls through to generation transparently.
- **Warmup/cooldown server-injected** — Claude does not generate warmup/cooldown (saves ~10–20% output tokens). Static templates in `lib/workout-templates.ts`, injected after parse.
- **All limits in `lib/config.ts`** — `PLAN_GENERATIONS_PER_IP`, `COMMUNITY_SHARES_PER_DAY`, `MAX_OUTPUT_TOKENS`. Change once, applies everywhere.
- **All app state in `page.tsx`** — step number, form fields, race history, plan result, similar plans, modals. Child components are controlled via props + callbacks.
- **Run type colors** are defined in `OutputPlan.tsx` via `RUN_TYPE_CONFIG` and `SESSION_STYLES` maps. Same maps duplicated in `CommunityPlanModal.tsx`. Adding a new run type requires updating both files.
- **Image export** uses a dedicated `PlanExportView` component (`components/PlanExportView.tsx`) rendered off-screen at fixed 800px with all inline styles. Captured via `html-to-image` `toPng()` with `pixelRatio: 2`, double-render pass (warmup + real capture), and `await document.fonts.ready` for correct font rendering. Mobile uses Web Share API; desktop uses `link.click()` download.
- **`PlanExportView`** is used by both `OutputPlan` and `CommunityPlanModal`. It accepts `plan`, `planLabel`, `meta: PlanExportMeta[]`, and optional `sharedBy`. All colors are inline hex — no Tailwind.
- **`@anthropic-ai/sdk`** is listed in `serverComponentsExternalPackages` in `next.config.mjs` so it only runs server-side.
- **HR Max is required** in StepThree — the "Next" button is disabled until a value is entered.
- **Race history validation** in StepTwo: experienced runners must add at least one race (unless target is Fun Run).
- **Target time is required** in StepOne — Next is blocked until a valid finish time is set. Too-fast times (below `minTotalMin`) are rejected with an error message.
- **`TimeInput` component** (`components/TimeInput.tsx`) is a shared H+MM dropdown pair. Used for target time (StepOne), beginner PB (StepTwo), and race PRs (StepTwo). `maxHours` prop controls the hour range per context.
- **Community sharing** — `OutputPlan` sends `target: formSummary.targetLabel` (e.g. `'Fun Run'`) to the save API. The community page filter dropdown `value` fields must match these exact strings.

### Config (`lib/config.ts`)

Central place for all tunable constants:
```ts
LIMITS.PLAN_GENERATIONS_PER_IP  // lifetime plan gen limit per IP (default 3)
LIMITS.COMMUNITY_SHARES_PER_DAY // daily share limit per IP (default 3)
LIMITS.MAX_OUTPUT_TOKENS        // Claude output token cap (default 14,000)
```
Import as `import { LIMITS } from '@/lib/config'` in any route that needs these values.

### Favicon

`/public/favicon.svg` — minimalist white running figure silhouette on transparent background, `viewBox="0 0 32 32"`. Referenced in `app/layout.tsx` via `metadata.icons: { icon: '/favicon.svg' }`.

### Styling conventions

- Tailwind only — no CSS modules, no styled-components.
- `OutputPlan` and `CommunityPlanModal` use the same light theme: `bg-slate-50` outer wrapper, `bg-white` cards, `border-slate-200` borders.
- Borders use `ring-1 ring-inset` (box-shadow based) instead of CSS `border` for correct html2canvas rendering.
- Global transitions are applied to all elements in `globals.css`; `.skeleton` class disables them for loading placeholders.

## Before pushing to GitHub

**Must check:**
1. `.env.local` is in `.gitignore` — never commit it (contains API keys)
2. Run `npm run build` locally — fix any TypeScript errors before push
3. Run `npm run lint` — fix any ESLint warnings
4. Do NOT commit `.next/` folder (should be in `.gitignore`)
5. Create a `.env.local.example` with placeholder values for documentation

**Secrets that must NOT be in git:**
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WAQI_TOKEN`
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are public-safe but still best kept out of git

## Deployment (free, showcase)

**Recommended: Vercel** (best fit for Next.js)
- Free Hobby tier: unlimited deployments, custom domain, edge network
- Connect GitHub repo → auto-deploy on push to `main`
- Set all env vars in Vercel dashboard → Settings → Environment Variables
- `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WAQI_TOKEN`
- No server config needed — Vercel handles Next.js API routes as serverless functions automatically

**Supabase** is already the DB — free tier covers this use case (500 MB, 2 GB bandwidth/month).

**Open-Meteo** (weather) is free with no API key required.

**WAQI** token is already configured — free tier is sufficient for showcase use.
