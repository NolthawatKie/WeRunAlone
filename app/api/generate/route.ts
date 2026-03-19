import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { LIMITS } from '@/lib/config';
import { getWorkoutTemplate } from '@/lib/workout-templates';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPaceStr(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')} min/km`;
}

function parsePaceSec(paceMinKm: string): number {
  // accepts "M:SS" or "M:SS min/km"
  const core = paceMinKm.split(' ')[0];
  const [m, s] = core.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

function formatPaceFromDistance(totalMin: number, distanceKm: number): string {
  const paceDecimal = totalMin / distanceKm;
  const paceMin = Math.floor(paceDecimal);
  const paceSec = Math.round((paceDecimal - paceMin) * 60);
  return `${paceMin}:${String(paceSec).padStart(2, '0')} min/km`;
}

// ── Volume guide — server-computed per target × level ─────────────────────────
// Long run and weekly km benchmarks that Claude must honour.

interface VolumeGuide {
  longRunStart: number;   // Phase 1 long run km
  longRunPeak: number;    // Last build-phase long run km
  easyRunBase: number;    // Phase 1 easy run km
  easyRunPeak: number;    // Peak easy run km
  weeklyKmBase: number;   // Phase 1 weekly total km
  weeklyKmPeak: number;   // Peak weekly total km
}

function getVolumeGuide(targetDistance: number, isBeginner: boolean): VolumeGuide {
  if (targetDistance <= 5) {
    return isBeginner
      ? { longRunStart: 4,  longRunPeak: 8,  easyRunBase: 4, easyRunPeak: 6,  weeklyKmBase: 12, weeklyKmPeak: 25 }
      : { longRunStart: 6,  longRunPeak: 10, easyRunBase: 5, easyRunPeak: 8,  weeklyKmBase: 20, weeklyKmPeak: 35 };
  } else if (targetDistance <= 10) {
    return isBeginner
      ? { longRunStart: 7,  longRunPeak: 14, easyRunBase: 5, easyRunPeak: 9,  weeklyKmBase: 20, weeklyKmPeak: 38 }
      : { longRunStart: 9,  longRunPeak: 16, easyRunBase: 6, easyRunPeak: 11, weeklyKmBase: 28, weeklyKmPeak: 52 };
  } else if (targetDistance <= 21.1) {
    return isBeginner
      ? { longRunStart: 10, longRunPeak: 18, easyRunBase: 6, easyRunPeak: 11, weeklyKmBase: 25, weeklyKmPeak: 48 }
      : { longRunStart: 13, longRunPeak: 22, easyRunBase: 8, easyRunPeak: 13, weeklyKmBase: 35, weeklyKmPeak: 65 };
  } else {
    return isBeginner
      ? { longRunStart: 14, longRunPeak: 28, easyRunBase: 8,  easyRunPeak: 13, weeklyKmBase: 35, weeklyKmPeak: 58 }
      : { longRunStart: 16, longRunPeak: 32, easyRunBase: 10, easyRunPeak: 16, weeklyKmBase: 45, weeklyKmPeak: 78 };
  }
}

// Per-phase volume notes to embed in prompt
function phaseVolumeNotes(
  buildPhases: number,
  totalPhases: number,
  hasTaper: boolean,
  vol: VolumeGuide,
): string {
  const lines: string[] = [];
  for (let i = 1; i <= buildPhases; i++) {
    const t = buildPhases === 1 ? 1 : (i - 1) / (buildPhases - 1);
    const longRun  = Math.round(vol.longRunStart  + t * (vol.longRunPeak  - vol.longRunStart));
    const easyRun  = Math.round(vol.easyRunBase   + t * (vol.easyRunPeak  - vol.easyRunBase));
    const weeklyKm = Math.round(vol.weeklyKmBase  + t * (vol.weeklyKmPeak - vol.weeklyKmBase));
    lines.push(`Phase ${i}: Long Run ~${longRun} km | Easy Run ~${easyRun} km | weekly total ~${weeklyKm} km`);
  }
  if (hasTaper) {
    const taperLR = Math.round(vol.longRunPeak * 0.55);
    lines.push(`Phase ${totalPhases} (Taper): Long Run ~${taperLR} km | cut ALL volumes 30–40%`);
  }
  return lines.map((l) => `  - ${l}`).join('\n');
}

// ── Pace zones — derived from race target time ────────────────────────────────
// Returns pace strings for all run types so Claude doesn't have to guess.

interface PaceZones {
  easy: string;
  longRun: string;
  tempo: string;
  interval: string;
  hill: string;
  racePace: string;
}

function getPaceZones(racePaceMinKm: string): PaceZones {
  const base = parsePaceSec(racePaceMinKm);
  return {
    racePace: formatPaceStr(base),
    easy:     formatPaceStr(base + 75),   // +75 s — conversational Zone 2
    longRun:  formatPaceStr(base + 60),   // +60 s — steady Zone 2-3
    tempo:    formatPaceStr(base + 15),   // +15 s — lactate threshold Zone 3-4
    interval: formatPaceStr(base - 15),   // −15 s — VO₂max Zone 4-5
    hill:     formatPaceStr(base - 10),   // −10 s effort equivalent
  };
}

// ── Warmup / cooldown injection ────────────────────────────────────────────────
// Runs after the AI response is parsed. Injects template warmup/cooldown into
// sessions that need them (Tempo, Interval, Hill Repeat, Long Run >60 min).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function injectWarmupCooldown(plan: any, template: { warmup: unknown[]; cooldown: unknown[] }): any {
  const INTENSE = new Set(['Tempo Run', 'Interval Run', 'Hill Repeat']);
  const warmupSess = { type: 'warmup', duration: 10, exercises: template.warmup, description: 'Dynamic warm-up to prepare muscles and joints' };
  const cooldownSess = { type: 'cooldown', duration: 10, exercises: template.cooldown, description: 'Static stretching to aid recovery' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plan.phases = (plan.phases ?? []).map((phase: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phase.days = (phase.days ?? []).map((day: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const core = (day.sessions ?? []).filter((s: any) => s.type !== 'warmup' && s.type !== 'cooldown');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const needsWC = core.some((s: any) =>
        s.type === 'run' && (INTENSE.has(s.runType) || (s.runType === 'Long Run' && (s.duration ?? 0) > 60))
      );
      day.sessions = needsWC ? [warmupSess, ...core, cooldownSess] : core;
      return day;
    });
    return phase;
  });
  return plan;
}

// ── API handler ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not set. Create a .env.local file.' },
        { status: 500 }
      );
    }

    // ── Rate limit: max 3 plan generations per IP (lifetime) ─────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      '127.0.0.1';
    const generateIpKey = `generate:${ip}`;

    const { data: rateRow } = await supabase
      .from('share_rate_limit')
      .select('id, count')
      .eq('ip', generateIpKey)
      .maybeSingle();

    if (rateRow && rateRow.count >= LIMITS.PLAN_GENERATIONS_PER_IP) {
      return NextResponse.json(
        { error: 'RATE_LIMIT' },
        { status: 429 },
      );
    }

    const client = new Anthropic({ apiKey });
    const body = await request.json();
    const {
      targetLabel, targetDistance, level, weeks, days, hrMax,
      targetTimeH, targetTimeM, targetTimeTotalMin,
      neverRunBefore, pbDistance, pbTime, raceHistory,
    } = body;

    if (!days || days.length === 0) {
      return NextResponse.json({ error: 'Select at least 1 training day.' }, { status: 400 });
    }

    const isBeginner = level === 'beginner';
    const levelText = isBeginner ? 'Beginner' : 'Experienced';
    const daysPerWeek = days.length;

    // Taper config
    const taperWeeks = targetDistance >= 42.2 ? 3 : targetDistance >= 21.1 ? 2 : targetDistance >= 10 ? 1 : 0;
    const hasTaper = taperWeeks > 0;
    const buildWeeks = weeks - taperWeeks;
    const suggestedBuildPhases = targetDistance <= 5 ? 2 : targetDistance <= 10 ? 2 : 3;
    const totalPhases = hasTaper ? suggestedBuildPhases + 1 : suggestedBuildPhases;

    // HR zones
    const hrCtx = hrMax
      ? `HR Max: ${hrMax} bpm | Z1:${Math.round(hrMax*0.5)}–${Math.round(hrMax*0.6)} | Z2:${Math.round(hrMax*0.6)}–${Math.round(hrMax*0.7)} | Z3:${Math.round(hrMax*0.7)}–${Math.round(hrMax*0.8)} | Z4:${Math.round(hrMax*0.8)}–${Math.round(hrMax*0.9)} | Z5:${Math.round(hrMax*0.9)}+`
      : 'No HR Max provided — use effort/pace descriptions only';

    // Weekly balance rules
    const balance =
      daysPerWeek >= 5 ? '2–3 run days, 1 strength, 1 plyometrics, rest as needed'
      : daysPerWeek === 4 ? '2 run days, 1 strength, 1 plyometrics'
      : daysPerWeek === 3 ? '2 run days, 1 strength or plyometrics'
      : '1–2 run days, rest';

    // ── Target time & pace zones ─────────────────────────────────────────────
    const totalMin: number = targetTimeTotalMin ?? ((targetTimeH ?? 0) * 60 + (targetTimeM ?? 0));
    const racePaceStr = totalMin > 0 ? formatPaceFromDistance(totalMin, targetDistance) : null;
    const paceZones = racePaceStr ? getPaceZones(racePaceStr) : null;

    const targetTimeCtx = racePaceStr
      ? `Race target: ${targetTimeH}h ${String(targetTimeM).padStart(2, '0')}m → race pace ${racePaceStr}. ALL paces in the plan MUST align with the zones below.`
      : '';

    // ── Volume / distance guide ───────────────────────────────────────────────
    const vol = getVolumeGuide(targetDistance, isBeginner);
    const phaseNotes = phaseVolumeNotes(suggestedBuildPhases, totalPhases, hasTaper, vol);

    // ── Runner background ─────────────────────────────────────────────────────
    let runnerCtx: string;
    if (isBeginner) {
      if (neverRunBefore) {
        runnerCtx = 'Completely new to running — no prior experience. Use most conservative end of pace ranges.';
      } else if (pbDistance && pbTime) {
        runnerCtx = `Beginner with PB: ${pbDistance} km in ${pbTime}. Calibrate paces from this.`;
      } else {
        runnerCtx = 'Beginner with some running experience, no recorded PB.';
      }
    } else {
      const raceEntries: Array<{ distance: number; label: string; count: number; prH: number; prM: number; actualDistance?: number }> = raceHistory || [];
      if (raceEntries.length > 0) {
        const raceSummary = raceEntries.map((r) => {
          const dist = r.distance === 5 && r.actualDistance ? `${r.actualDistance}km` : r.label;
          const hasPr = r.prH > 0 || r.prM > 0;
          const prStr = hasPr ? `(PR:${r.prH}:${String(r.prM).padStart(2, '0')})` : '';
          return `${dist}×${r.count}${prStr}`;
        }).join(', ');
        runnerCtx = `Experienced runner. Race history: ${raceSummary}. Use PRs to calibrate paces.`;
      } else {
        runnerCtx = 'Experienced runner (no specific race records).';
      }
    }

    const taperNote = hasTaper
      ? `Phase ${totalPhases} MUST be the Taper phase: phaseName="Taper — Race Week Prep", repeatWeeks=${taperWeeks}, weekRange="Week ${buildWeeks + 1}–${weeks}". Reduce volume 30–50%, maintain intensity, favour Easy Run.`
      : '';

    // ── Dynamic example JSON (uses actual first two user days + realistic distance) ──
    const exDay1 = days[0];
    const exDay2 = days[1] ?? days[0];
    const exEasyRun = vol.easyRunBase;
    const exEasyDuration = Math.round(exEasyRun / (isBeginner ? 7 : 5.5) * 60);
    const exEasyPace = paceZones ? paceZones.easy : isBeginner ? '7:00 min/km' : '5:45 min/km';

    const exJson = JSON.stringify({
      planName: 'Example Plan',
      totalWeeks: weeks,
      phases: [{
        phaseNumber: 1,
        phaseName: 'Base Building',
        repeatWeeks: Math.min(4, buildWeeks),
        weekRange: 'Week 1–4',
        days: [
          {
            dayName: exDay1,
            type: 'run',
            sessions: [{
              type: 'run', runType: 'Easy Run',
              distance: exEasyRun, duration: exEasyDuration,
              pace: exEasyPace, zone: 'Zone 2', effort: '60–70% HRmax',
              description: 'Conversational pace — you should be able to hold a full conversation',
            }],
          },
          {
            dayName: exDay2,
            type: 'strength',
            sessions: [{
              type: 'strength', duration: 40,
              exercises: [
                { name: 'Goblet Squat',   sets: 3, reps: 12, note: 'Chest up, depth below parallel' },
                { name: 'Hip Thrust',     sets: 3, reps: 15, note: 'Drive through heels, full hip extension' },
                { name: 'Single-Leg Deadlift', sets: 3, reps: 10, note: 'Hinge at hips, keep back flat' },
              ],
            }],
          },
        ],
      }],
    });

    // ── Pace zone block for prompt ─────────────────────────────────────────────
    const paceBlock = paceZones
      ? `TRAINING PACES (mandatory — use these exact values, ±10 s is acceptable):
- Easy Run:     ${paceZones.easy}   (Zone 2, conversational)
- Long Run:     ${paceZones.longRun}   (Zone 2–3, steady)
- Tempo Run:    ${paceZones.tempo}   (Zone 3–4, comfortably hard, threshold effort)
- Interval Run: ${paceZones.interval}   (Zone 4–5, very hard, short reps)
- Hill Repeat:  ${paceZones.hill}   (Zone 4–5, max effort uphill)
- Race Pace:    ${paceZones.racePace}   (target race day average pace)`
      : `TRAINING PACES: Estimate from runner level — ${isBeginner ? 'Easy Run 6:45–7:30 min/km, Long Run 7:00–8:00 min/km, Tempo 6:00–6:30 min/km' : 'Easy Run 5:30–6:00 min/km, Long Run 5:45–6:15 min/km, Tempo 4:45–5:15 min/km'}`;

    // ── Full prompt ────────────────────────────────────────────────────────────
    const prompt = `You are an expert running coach with 20+ years of experience. Generate a scientifically structured ${weeks}-week training plan.

RUNNER PROFILE:
- Goal: ${targetLabel} (${targetDistance} km)
- Level: ${levelText}
- Background: ${runnerCtx}
- Training days (${daysPerWeek}/week): ${days.join(', ')}
- ${hrCtx}
${targetTimeCtx ? `- ${targetTimeCtx}` : ''}

PLAN STRUCTURE: ${totalPhases} phases, exactly ${weeks} total weeks
- Build phases: ${buildWeeks} weeks across ${suggestedBuildPhases} phases
${taperNote ? `- ${taperNote}` : ''}

VOLUME TARGETS (mandatory — distances below are the minimum required):
${phaseNotes}
- Long Run MUST be the longest run of the week. It must meet or exceed the phase target above.
- Easy runs must match the phase easy-run target above (not shorter).
- Weekly total km must be distributed across all training days.
- Apply a cut-back week (80% volume) every 3–4 weeks to allow recovery.
- Do NOT repeat the same week; each week within a phase should show small progression.

${paceBlock}

DAILY RULES:
- Each phase must include EVERY training day: ${days.join(', ')}
- Weekly balance: ${balance}
- Do NOT include warmup or cooldown session types — omit them entirely
- Rest day format: { "dayName": "...", "type": "rest", "sessions": [] }
- Strength/plyometrics sessions must always list 4–6 exercises with sets, reps, and notes

RUN TYPES (use exact spelling — no other values allowed):
"Easy Run" | "Long Run" | "Tempo Run" | "Interval Run" | "Hill Repeat"

STRENGTH exercises (pick 4–6 per session):
Goblet Squat, Romanian Deadlift, Hip Thrust, Bulgarian Split Squat, Nordic Curl, Calf Raise, Step-Up, Single-Leg Deadlift, Lateral Band Walk, Glute Bridge, Box Step-Up

PLYOMETRICS exercises (pick 4–6 per session):
Squat Jump, Box Jump, Burpee, Lunge Jump, Lateral Bound, Tuck Jump, Broad Jump, Single-Leg Hop, Skater Jump, Depth Jump

QUALITY STANDARDS:
- Every run session MUST have: distance (km), duration (min), pace, zone, effort description
- Long runs must reach the phase target km — do not truncate them
- Tempo/Interval/Hill sessions must be meaningfully harder than Easy Runs (shorter distance, faster pace)
- Descriptions must be specific coaching cues, not generic text

OUTPUT: Pure JSON only. No markdown. No text before or after. Schema:
${exJson}

Generate ALL ${totalPhases} phases with ALL days (${days.join(', ')}), full sessions, correct distances, and exercises. Do not omit any phase or day.`;

    const callClaude = async () => client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: LIMITS.MAX_OUTPUT_TOKENS,
      system: 'You are an expert running coach. Output pure JSON only — no markdown fences, no explanation, no text before or after the JSON object. Every run session must have a realistic distance in km matching the volume guidelines provided. CRITICAL: You MUST complete the entire JSON — every phase must have all its days fully populated. Never leave days arrays empty.',
      messages: [{ role: 'user', content: prompt }],
    });

    const parseResponse = (message: Awaited<ReturnType<typeof callClaude>>) => {
      if (message.stop_reason === 'max_tokens') {
        throw new Error('TOKEN_LIMIT');
      }
      const content = message.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type from API');
      let jsonText = content.text.trim();
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
      console.log('[generate] stop_reason:', message.stop_reason, '| response length:', jsonText.length);
      return JSON.parse(jsonText);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RawPhase = { days?: unknown[]; weeks?: { days?: unknown[] }[]; schedule?: unknown[]; [key: string]: unknown };

    // Normalize AI response quirks — AI sometimes wraps days inside weeks[] or uses a different key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizePlan = (raw: any) => {
      if (!raw?.phases) return raw;
      raw.phases = raw.phases.map((p: RawPhase) => {
        // Case 1: days[] items are week objects ({ week: N, days: [...] }) — flatten them
        if (Array.isArray(p.days) && p.days.length > 0) {
          const first = p.days[0] as Record<string, unknown>;
          if (first && typeof first === 'object' && Array.isArray(first.days)) {
            const flatDays: unknown[] = [];
            for (const week of p.days as Array<{ days?: unknown[] }>) {
              if (Array.isArray(week.days)) flatDays.push(...week.days);
            }
            if (flatDays.length > 0) p.days = flatDays;
          }
        }
        // Case 2: top-level weeks[] key instead of days[]
        if ((!p.days || p.days.length === 0) && Array.isArray(p.weeks) && p.weeks.length > 0) {
          const flatDays: unknown[] = [];
          for (const week of p.weeks) {
            if (Array.isArray(week.days)) flatDays.push(...week.days);
          }
          if (flatDays.length > 0) p.days = flatDays;
        }
        // Case 3: "schedule" key instead of "days"
        if ((!p.days || p.days.length === 0) && Array.isArray(p.schedule) && p.schedule.length > 0) {
          p.days = p.schedule;
        }
        return p;
      });
      return raw;
    };

    let plan;
    let parseError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const message = await callClaude();
        plan = normalizePlan(parseResponse(message));
        const emptyPhases = (plan.phases ?? []).filter(
          (p: RawPhase) => !p.days || (p.days as unknown[]).length === 0
        );
        if (emptyPhases.length > 0) {
          console.error(`[generate] Attempt ${attempt}: phases missing days:`, emptyPhases.map((p: RawPhase) => p.phaseName ?? p.phaseNumber));
          parseError = new Error('AI returned incomplete plan (phases have no days). Please try again.');
          plan = null;
          continue;
        }
        parseError = null;
        break;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        // TOKEN_LIMIT is unrecoverable — don't retry
        if (e.message === 'TOKEN_LIMIT') {
          return NextResponse.json({ error: 'TOKEN_LIMIT' }, { status: 422 });
        }
        parseError = e;
        console.error(`[generate] Attempt ${attempt} failed:`, parseError.message);
      }
    }
    if (!plan) throw parseError ?? new Error('AI returned invalid JSON. Please try again.');

    plan = injectWarmupCooldown(plan, getWorkoutTemplate(targetLabel, level));

    // ── Update generate rate limit count ──────────────────────────────────────
    if (rateRow) {
      await supabase
        .from('share_rate_limit')
        .update({ count: rateRow.count + 1 })
        .eq('id', rateRow.id);
    } else {
      await supabase
        .from('share_rate_limit')
        .insert({ ip: generateIpKey, date: new Date().toISOString().split('T')[0], count: 1 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('[generate] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate plan: ${message}` }, { status: 500 });
  }
}
