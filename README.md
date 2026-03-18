# WeRunAlone
AI-powered running training plan generator built with Next.js, Claude API, and Supabase.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
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

   Copy the example env file and fill in your credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local`:

   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   WAQI_TOKEN=...
   ```

4. **Set up Supabase tables**

   Run the following SQL in your Supabase SQL editor:

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

   -- Rate limiting table
   CREATE TABLE share_rate_limit (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     ip text,
     count int DEFAULT 1,
     date date DEFAULT current_date
   );

   -- RLS policies: community_plans
   ALTER TABLE community_plans ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Anyone can read plans"
   ON community_plans FOR SELECT TO anon USING (true);

   CREATE POLICY "Service role can insert"
   ON community_plans FOR INSERT TO service_role WITH CHECK (true);

   CREATE POLICY "Service role can update"
   ON community_plans FOR UPDATE TO service_role USING (true);

   -- RLS policies: share_rate_limit (service role only)
   ALTER TABLE share_rate_limit ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Service role only"
   ON share_rate_limit FOR ALL TO service_role USING (true);
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build (type-checks + compiles) |
| `npm run lint` | Run ESLint |
| `npm run start` | Run production build |
