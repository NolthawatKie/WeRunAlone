# WeRunAlone

Free running training plan generator built with Next.js, Claude API, and Supabase.

Users fill a 4-step form → Claude generates a personalised plan → export as PNG or share to the community feed. Community plans can be browsed and used directly, skipping AI generation entirely.

---

## Features

- **4-step plan builder** — race target + finish time, level/experience, HR Max, review
- **Similar plans search** — checks community plans (same target + level + ±2 weeks) before calling Claude; popup if no match
- **AI plan generation** — `claude-sonnet-4-6` builds a multi-phase plan with run, strength, and plyometrics sessions
- **Warmup/cooldown templates** — 8 static templates (4 targets × 2 levels) injected server-side; not AI-generated
- **PNG export** — save plan as image; mobile uses Web Share API, desktop downloads directly
- **Community feed** — browse, filter, view, and download shared plans
- **Weather widget** — run condition score based on location, temperature, humidity, wind, and AQI
- **Rate limiting** — 100 plans global lifetime cap + 3 plans per IP lifetime cap
- **Claude Skill** — downloadable `SKILL.md` on the About page; use the same coach logic inside your own Claude Project
- **About & Updates pages** — project overview and changelog rendered from `updatelog.md`

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- A [WAQI](https://aqicn.org/api/) token (air quality widget)

### Installation

1. Clone and install

   ```bash
   git clone <repo-url>
   cd WeRunAlone
   npm install
   ```

2. Set up environment variables

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   WAQI_TOKEN=...
   ```

3. Set up Supabase tables

   ```sql
   CREATE TABLE community_plans (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     target text, level text, weeks int, run_days text[],
     hr_max int, plan_data jsonb, plan_name text, shared_by text,
     download_count int DEFAULT 0, created_at timestamp DEFAULT now()
   );

   CREATE TABLE share_rate_limit (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     ip text, count int DEFAULT 1, date date DEFAULT current_date
   );

   ALTER TABLE community_plans ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "anon read" ON community_plans FOR SELECT TO anon USING (true);
   CREATE POLICY "service insert" ON community_plans FOR INSERT TO service_role WITH CHECK (true);
   CREATE POLICY "service update" ON community_plans FOR UPDATE TO service_role USING (true);

   ALTER TABLE share_rate_limit ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "service only" ON share_rate_limit FOR ALL TO service_role USING (true);
   ```

4. Start dev server

   ```bash
   npm run dev
   ```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run start` | Run production build |

---

## Configuration

All limits live in **`lib/config.ts`**:

```ts
export const LIMITS = {
  PLAN_GENERATIONS_GLOBAL: 100,  // total across all users, lifetime
  PLAN_GENERATIONS_PER_IP: 3,    // per IP, lifetime
  MAX_OUTPUT_TOKENS: 14000,      // Claude output token cap
};
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing + 4-step form + similar plans + plan output |
| `/community` | Browse & filter shared community plans |
| `/about` | Objective, tech stack, architecture + Skill download |
| `/updates` | Changelog from `updatelog.md` |

---

## Architecture

```
app/page.tsx                    — all state: steps, form, plan, modals
  ├── LandingPage               — hero + run type guide + weather widget
  ├── StepOne–Four              — 4-step form
  ├── SimilarPlansPanel         — community plan search before generation
  ├── LoadingSkeleton
  └── OutputPlan                — plan display + export + share

app/community/page.tsx          — browse community plans
  └── CommunityPlanModal        — full plan view + export

app/about/page.tsx              — server component; includes Skill download
app/updates/page.tsx            — server component; reads updatelog.md

app/api/generate/route.ts       — rate limit → Claude → warmup inject → return plan
app/api/community/save          — insert plan (no rate limit)
app/api/community/list          — filter by target/level/weeksNear
app/api/community/[id]          — fetch single plan
app/api/community/download/[id] — increment download_count + return plan
app/api/aqi                     — server-side WAQI proxy

lib/config.ts                   — all tunable limits
lib/workout-templates.ts        — 8 static warmup/cooldown templates
public/SKILL.md                 — downloadable Claude Skill for running plans
updatelog.md                    — changelog source; add a row + redeploy to update /updates
```

### Key design decisions

- **Community-first** — checks community plans before calling Claude; zero AI cost if user picks one
- **No descriptions** — Claude never generates description text; saves ~25–35% output tokens
- **Server-injected warmup/cooldown** — static templates added after parsing; saves ~10–20% tokens
- **Dual rate limit** — global counter (`ip = 'global:generate'`) + per-IP counter (`ip = 'generate:{ip}'`), both in `share_rate_limit` table, both lifetime (no date filter)
- **Sharing unlimited** — community sharing has no rate limit; only plan generation is capped
- **Claude Skill** — `public/SKILL.md` follows the standard SKILL.md format with YAML frontmatter; users download it from `/about` and paste into Claude Project instructions

---

## Cost Estimate (claude-sonnet-4-6)

| Scenario | Output tokens | Cost/call |
|---|---|---|
| Fun Run, 4w, 3 days | ~500 | ~$0.008 |
| Half Marathon, 16w, 5 days | ~1,800 | ~$0.027 |
| Full Marathon, 30w, 7 days | ~2,300 | ~$0.035 |
| Token limit hit (14k cap) | 14,000 | ~$0.213 |

---

## Deployment

**Recommended: [Vercel](https://vercel.com)** (free Hobby tier)

1. Connect GitHub repo → auto-deploys on push to `main`
2. Add env vars in Vercel → Settings → Environment Variables
3. Add rows to `updatelog.md` and push to update `/updates`
