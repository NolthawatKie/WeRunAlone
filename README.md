# WeRunAlone

Free running training plan generator built with Next.js, Claude API, and Supabase.

Users fill a 4-step form → Claude generates a personalised plan → export as PNG or share to the community feed. Community plans can be browsed and used directly, skipping AI generation entirely.

---

## Features

- **4-step plan builder** — race target + finish time, level/experience, HR Max, review
- **Similar plans search** — before generating, shows matching community plans (same target + level + ±2 weeks); use one directly or generate new; popup if no match found
- **AI plan generation** — `claude-sonnet-4-6` builds a fully structured multi-phase plan with run, strength, and plyometrics sessions (no descriptions generated — saves ~25–35% output tokens)
- **Warmup/cooldown templates** — 8 static templates (4 targets × 2 levels) injected server-side after generation; not consumed from AI tokens
- **PNG export** — save plan as image (mobile uses Web Share API, desktop downloads directly); export matches on-screen display exactly
- **Community feed** — browse, filter, view, and save shared plans; user names their plan before sharing; saves counter increments on export
- **Weather widget** — run condition score based on location, temperature, humidity, wind, and AQI
- **Rate limiting** — 3 plan generations per IP (lifetime); 3 community shares per IP per day
- **About page** — objective, tech stack, structure, and key design decisions
- **Updates page** — changelog rendered from `updatelog.md` in the repo root

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [WAQI](https://aqicn.org/api/) API token (for air quality widget)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd WeRunAlone
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   WAQI_TOKEN=...
   ```

4. **Set up Supabase tables**

   Run in your Supabase SQL editor:

   ```sql
   -- Community plans table
   CREATE TABLE community_plans (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     target text,
     level text,
     weeks int,
     run_days text[],
     hr_max int,
     plan_data jsonb,
     plan_name text,
     shared_by text,
     download_count int DEFAULT 0,
     created_at timestamp DEFAULT now()
   );

   -- Rate limiting table (used for both plan generation and community sharing)
   CREATE TABLE share_rate_limit (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     ip text,
     count int DEFAULT 1,
     date date DEFAULT current_date
   );

   -- RLS: community_plans
   ALTER TABLE community_plans ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Anyone can read plans"
   ON community_plans FOR SELECT TO anon USING (true);

   CREATE POLICY "Service role can insert"
   ON community_plans FOR INSERT TO service_role WITH CHECK (true);

   CREATE POLICY "Service role can update"
   ON community_plans FOR UPDATE TO service_role USING (true);

   -- RLS: share_rate_limit (service role only — users cannot bypass via direct calls)
   ALTER TABLE share_rate_limit ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Service role only"
   ON share_rate_limit FOR ALL TO service_role USING (true);
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build (type-checks + compiles) |
| `npm run lint` | Run ESLint |
| `npm run start` | Run production build |

---

## Configuration

All tunable limits and thresholds live in **`lib/config.ts`**. Edit that file to change any value without touching business logic:

```ts
export const LIMITS = {
  PLAN_GENERATIONS_PER_IP: 3,   // lifetime per IP
  COMMUNITY_SHARES_PER_DAY: 3,  // per day per IP
  MAX_OUTPUT_TOKENS: 14000,     // Claude output token cap
};
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main app — landing + 4-step form + similar plans + plan output |
| `/community` | Browse & filter shared community plans |
| `/about` | Project objective, tech stack, and architecture overview |
| `/updates` | Changelog — rendered from `updatelog.md` at build time |

---

## Architecture

```
app/page.tsx                   — all state: steps, form, plan, modals, similar plans
  ├── LandingPage              — hero + run type guide + weather widget
  ├── StepOne–Four             — 4-step form
  ├── SimilarPlansPanel        — community plan search before generation
  ├── LoadingSkeleton          — shown during AI call
  └── OutputPlan               — renders plan + export + share (user names plan before sharing)

app/community/page.tsx         — browse & filter community plans
  └── CommunityPlanModal       — full plan view + export

app/about/page.tsx             — static about page (server component)
app/updates/page.tsx           — reads updatelog.md, renders changelog table (server component)

app/api/generate/route.ts      — rate limit → Claude API → inject warmup/cooldown → return plan
app/api/community/save         — rate limit → insert to Supabase
app/api/community/list         — filter by target/level/weeks; weeksNear param for ±2 range search
app/api/community/[id]         — fetch single plan
app/api/community/download/[id]— increment download_count + return plan_data
app/api/aqi                    — server-side WAQI proxy

lib/config.ts                  — LIMITS (generation cap, share cap, max tokens)
lib/workout-templates.ts       — 8 static warmup/cooldown templates (4 targets × 2 levels)
lib/supabase.ts                — Supabase client
updatelog.md                   — changelog source; add a row here after every deployment
```

### Key design decisions

- **Similar plans first** — StepFour "Find Similar Plans" queries community before calling Claude. If matching plans exist (same target + level + ±2 weeks), user can use one directly (saves AI cost entirely). If none found, a popup asks the user to confirm before generating.
- **No descriptions in prompt** — Claude does not generate description text for any session type. Run sessions show pace, distance, zone, and effort chips only. Exercises show name + sets×reps. Saves ~25–35% output tokens.
- **Warmup/cooldown server-injected** — Claude does not generate warmup or cooldown sessions. The generate route strips any it hallucinates and injects the appropriate static template after parsing, saving a further ~10–20% output tokens.
- **All limits in `lib/config.ts`** — `PLAN_GENERATIONS_PER_IP`, `COMMUNITY_SHARES_PER_DAY`, `MAX_OUTPUT_TOKENS` are all in one place.
- **Rate limit table dual-purpose** — `share_rate_limit` stores both plan generation rows (`ip = "generate:{ip}"`, no date filter, lifetime count) and sharing rows (`ip = "{ip}"`, date-filtered, resets daily).
- **`PlanExportView`** — dedicated off-screen component at fixed 800px with all inline styles for reliable PNG capture via `html-to-image`. Renders identically to the on-screen view.
- **All app state in `page.tsx`** — steps, form fields, plan result, similar plans, modals.
- **Days always Mon→Sun** — `sortDays()` in `page.tsx` ensures `selectedDays` is always sorted; community `run_days` sorted at display time in `CommunityPlanModal`.
- **Updates page from file** — `/updates` is a Next.js server component that reads `updatelog.md` with `fs.readFileSync` at build time and parses the markdown table. Add a row to `updatelog.md` and redeploy to update the changelog.

---

## Cost Estimate (claude-sonnet-4-6)

Descriptions removed from prompt → realistic plans now use ~500–2,500 output tokens.

| Scenario | Output tokens | Cost/call |
|---|---|---|
| Min — Fun Run, 4w, 3 days | ~500 | ~$0.008 |
| Typical — Half Marathon, 16w, 5 days | ~1,800 | ~$0.027 |
| Max realistic — Full Marathon, 30w, 7 days | ~2,300 | ~$0.035 |
| Token limit hit (14k cap) | 14,000 | ~$0.213 |

Per user (3 lifetime generations): **$0.02 – $0.45** depending on plan complexity.

---

## Deployment

**Recommended: [Vercel](https://vercel.com)** (free Hobby tier)

1. Connect GitHub repo → auto-deploys on push to `main`
2. Set environment variables in Vercel dashboard → Settings → Environment Variables:
   `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WAQI_TOKEN`
3. No server config needed — API routes run as serverless functions automatically
4. After adding entries to `updatelog.md`, push to `main` to trigger a redeploy so `/updates` reflects the new entries
