# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build (type-checks + compiles)
npm run lint     # ESLint via next lint
npm run start    # Run production build
```

No test suite is configured. There is no test runner — verify changes visually via the dev server.

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

**Theme:** Light blue tone — `bg-slate-50` body, `bg-white` cards, `border-slate-200` borders, blue/purple gradient CTAs. The `globals.css` intentionally does NOT set background/color on `html, body`; those come from `layout.tsx` body class.

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Main app — landing + 4-step form + plan output |
| `/community` | `app/community/page.tsx` | Browse & view shared community plans |

### Data flow

```
app/page.tsx (all state lives here)
  ├── LandingPage          — hero + "Build My Plan" + "Explore Community" buttons + WeatherWidget
  ├── StepOne              — target selection → passes (id, label, distance, weekConfig, minDays)
  ├── StepTwo              — level + experience + weeks + days
  │     ├── beginner sub-form: "Never run before" toggle OR optional PB (distance + time)
  │     └── experienced sub-form: race history (4 distance checkboxes, count stepper, PR, actualDistance for Under 10km)
  ├── StepThree            — HR Max (required — blocks progression if empty)
  ├── StepFour             — review all inputs before generating
  ├── LoadingSkeleton      — shown during API call
  └── OutputPlan           — renders plan + PNG export + "Share to Community" button
        ├── POST /api/generate → Claude API → JSON plan
        └── POST /api/community/save → Supabase community_plans table

app/community/page.tsx
  └── CommunityPlanModal   — full plan view + PNG export
        ├── GET /api/community/list?target&level
        ├── GET /api/community/[id]
        └── POST /api/community/download/[id]
```

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

**RLS policies (applied in Supabase):**
- `community_plans`: anon SELECT only; service_role INSERT + UPDATE; no DELETE policy
- `share_rate_limit`: service_role all; anon no access
- All writes go through server-side API routes (using `SUPABASE_SERVICE_ROLE_KEY`) — users cannot bypass rate limiting via direct Supabase calls

**Rate limit:** max 3 shares per IP per day, enforced in `/api/community/save`.

**Target values stored in DB** (must match exactly for filter to work):
`'Fun Run'` · `'Mini Marathon'` · `'Half Marathon'` · `'Full Marathon'`
These come from StepOne's `label` field — do NOT include the distance suffix.

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
| 4    | StepFour    | review only — triggers `handleGenerate` on submit |

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
- `DAILY RULES` — per-day type balance, warmup/cooldown conditions
- Dynamic JSON schema example using actual user days + realistic distances from volume guide

Key server-side computations (`route.ts`):
- `getVolumeGuide(targetDistance, isBeginner)` — returns `longRunStart`, `longRunPeak`, `easyRunBase`, `easyRunPeak`, `weeklyKmBase`, `weeklyKmPeak`
- `phaseVolumeNotes(...)` — generates per-phase distance targets interpolated between start and peak
- `getPaceZones(racePaceMinKm)` — derives all 5 training paces from race target pace
- `parsePaceSec` / `formatPaceStr` — pace string utilities

Returns **raw JSON only** (no markdown). Markdown fences stripped before `JSON.parse`. Response is validated — throws if any phase has no `days`.

Model: `claude-sonnet-4-6`, `max_tokens: 8192`.

### Key design decisions

- **All app state in `page.tsx`** — step number, form fields, race history, plan result. Child components are controlled via props + callbacks.
- **Run type colors** are defined in `OutputPlan.tsx` via `RUN_TYPE_CONFIG` and `SESSION_STYLES` maps. Same maps duplicated in `CommunityPlanModal.tsx`. Adding a new run type requires updating both files.
- **Warmup/cooldown** are only included in the prompt for intense sessions (Tempo, Interval, Hill, Long Run >60 min).
- **Image export** uses `html-to-image` `toPng()` with `pixelRatio: 2`, `backgroundColor: '#f8fafc'` (slate-50), and no forced width — do not add `width` or `style.width` overrides or the export will compress.
- **`@anthropic-ai/sdk`** is listed in `serverComponentsExternalPackages` in `next.config.mjs` so it only runs server-side.
- **HR Max is required** in StepThree — the "Next" button is disabled until a value is entered.
- **Race history validation** in StepTwo: experienced runners must add at least one race (unless target is Fun Run).
- **Target time is required** in StepOne — Next is blocked until a valid finish time is set. Too-fast times (below `minTotalMin`) are rejected with an error message.
- **`TimeInput` component** (`components/TimeInput.tsx`) is a shared H+MM dropdown pair. Used for target time (StepOne), beginner PB (StepTwo), and race PRs (StepTwo). `maxHours` prop controls the hour range per context.
- **Time state** — `pbTimeH`/`pbTimeM` (replace old `pbTime: string`); `RaceEntry.prH`/`prM` (replace old `pr: string`). 0h 00m = not entered. Strings are composed on the fly for the API prompt.
- **Community sharing** — `OutputPlan` sends `target: formSummary.targetLabel` (e.g. `'Fun Run'`) to the save API. The community page filter dropdown `value` fields must match these exact strings.

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
