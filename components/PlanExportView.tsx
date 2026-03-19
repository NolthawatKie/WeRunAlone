'use client';

import { forwardRef } from 'react';
import type { TrainingPlan, Phase, Day, Session } from '@/types/plan';

// ─── Inline color maps (no Tailwind — guaranteed rendering in html-to-image) ──

const RUN: Record<string, { bg: string; bd: string; dot: string; c: string; tip: string }> = {
  'Easy Run':     { bg: '#f0fdf4', bd: '#bbf7d0', dot: '#22c55e', c: '#15803d', tip: 'Conversational pace · Zone 1–2' },
  'Long Run':     { bg: '#f0f9ff', bd: '#bae6fd', dot: '#0ea5e9', c: '#0369a1', tip: 'Slow & steady · Zone 2' },
  'Tempo Run':    { bg: '#fff7ed', bd: '#fed7aa', dot: '#f97316', c: '#c2410c', tip: 'Comfortably hard · Zone 3–4' },
  'Interval Run': { bg: '#fef2f2', bd: '#fecaca', dot: '#ef4444', c: '#b91c1c', tip: 'Fast bursts + rest · Zone 4–5' },
  'Hill Repeat':  { bg: '#faf5ff', bd: '#e9d5ff', dot: '#a855f7', c: '#7e22ce', tip: 'Uphill sprints · Zone 4' },
};

const SESS: Record<string, { bg: string; bd: string; dot: string; c: string; label: string }> = {
  warmup:      { bg: '#f0fdf4', bd: '#bbf7d0', dot: '#22c55e', c: '#15803d', label: 'Warm Up' },
  cooldown:    { bg: '#f0fdfa', bd: '#99f6e4', dot: '#14b8a6', c: '#0f766e', label: 'Cool Down' },
  run:         { bg: '#eff6ff', bd: '#bfdbfe', dot: '#3b82f6', c: '#1d4ed8', label: 'Run' },
  strength:    { bg: '#f5f3ff', bd: '#ddd6fe', dot: '#8b5cf6', c: '#6d28d9', label: 'Strength' },
  plyometrics: { bg: '#fefce8', bd: '#fef08a', dot: '#eab308', c: '#a16207', label: 'Plyometrics' },
  rest:        { bg: '#f8fafc', bd: '#e2e8f0', dot: '#94a3b8', c: '#64748b', label: 'Rest' },
};

const DAY_DOT: Record<string, string> = {
  run: '#3b82f6', strength: '#8b5cf6', plyometrics: '#eab308', rest: '#94a3b8',
};
const DAY_BADGE: Record<string, { bg: string; c: string; bd: string; label: string }> = {
  run:         { bg: '#eff6ff', c: '#1d4ed8', bd: '#bfdbfe', label: 'Run' },
  strength:    { bg: '#f5f3ff', c: '#6d28d9', bd: '#ddd6fe', label: 'Strength' },
  plyometrics: { bg: '#fefce8', c: '#a16207', bd: '#fef08a', label: 'Plyo' },
  rest:        { bg: '#f1f5f9', c: '#64748b', bd: '#e2e8f0', label: 'Rest' },
};

const P_ACCENT = ['#3b82f6', '#a855f7', '#10b981', '#f97316', '#f43f5e'];
const P_BG     = ['#eff6ff', '#faf5ff', '#f0fdf4', '#fff7ed', '#fff1f2'];
const P_TEXT   = ['#1d4ed8', '#7e22ce', '#15803d', '#c2410c', '#be123c'];
const P_BD     = ['#bfdbfe', '#e9d5ff', '#bbf7d0', '#fed7aa', '#fecdd3'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ESession({ s }: { s: Session }) {
  const run   = s.type === 'run' && s.runType ? RUN[s.runType] : null;
  const def   = SESS[s.type] ?? SESS.rest;
  const bg    = run ? run.bg : def.bg;
  const bd    = run ? run.bd : def.bd;
  const dot   = run ? run.dot : def.dot;
  const c     = run ? run.c : def.c;
  const label = run ? s.runType! : def.label;

  return (
    <div style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c }}>{label}</span>
        {s.duration > 0 && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{s.duration} min</span>}
      </div>

      {run?.tip && <div style={{ fontSize: 11, color: c, opacity: 0.75, marginBottom: 4 }}>{run.tip}</div>}

      {s.type === 'run' && (s.distance != null || s.zone || s.effort || s.pace) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: s.description ? 4 : 0 }}>
          {s.distance != null && (
            <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1px 7px' }}>
              📏 {s.distance} km
            </span>
          )}
          {s.zone && (
            <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1px 7px' }}>
              💓 {s.zone}
            </span>
          )}
          {s.effort && (
            <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1px 7px' }}>
              ⚡ {s.effort}
            </span>
          )}
          {s.pace && (
            <span style={{ fontSize: 10, fontWeight: 600, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: 12, padding: '1px 7px' }}>
              🏃 {s.pace}
            </span>
          )}
        </div>
      )}

      {s.description && (
        <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{s.description}</p>
      )}

      {(s.type === 'strength' || s.type === 'plyometrics') && s.exercises && s.exercises.length > 0 && (
        <div style={{ marginTop: 5 }}>
          {s.exercises.map((ex, i) => {
            const isSt = s.type === 'strength';
            return (
              <div key={i} style={{
                background: isSt ? '#f5f3ff' : '#fefce8',
                border: `1px solid ${isSt ? '#ddd6fe' : '#fef08a'}`,
                borderRadius: 5, padding: '4px 7px', marginBottom: 3,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: isSt ? '#6d28d9' : '#a16207' }}>{ex.name}</span>
                <span style={{ fontSize: 11, color: isSt ? '#8b5cf6' : '#ca8a04', marginLeft: 6 }}>{ex.sets} × {ex.reps} reps</span>
                {ex.note && (
                  <p style={{ fontSize: 10, color: isSt ? '#8b5cf6' : '#ca8a04', margin: '2px 0 0', lineHeight: 1.4 }}>{ex.note}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EDay({ day }: { day: Day }) {
  const dot   = DAY_DOT[day.type]   ?? DAY_DOT.rest;
  const badge = DAY_BADGE[day.type] ?? DAY_BADGE.rest;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', width: 'calc(50% - 5px)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{day.dayName}</span>
        </div>
        <span style={{ fontSize: 10, background: badge.bg, color: badge.c, border: `1px solid ${badge.bd}`, borderRadius: 10, padding: '1px 8px' }}>
          {badge.label}
        </span>
      </div>
      <div style={{ padding: '8px 10px 4px' }}>
        {day.type === 'rest' && (!day.sessions || day.sessions.length === 0)
          ? <div style={{ padding: '8px 0', fontSize: 12, color: '#94a3b8' }}>😴 Rest — let your body recover</div>
          : day.sessions?.map((s, i) => <ESession key={i} s={s} />)
        }
      </div>
    </div>
  );
}

function EPhase({ phase, idx }: { phase: Phase; idx: number }) {
  const i = idx % P_ACCENT.length;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', marginBottom: 10,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${P_ACCENT[i]}`,
        borderRadius: 10,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          background: P_BG[i], color: P_TEXT[i], border: `1px solid ${P_BD[i]}`,
          borderRadius: 10, padding: '2px 10px', flexShrink: 0, whiteSpace: 'nowrap',
        }}>Phase {phase.phaseNumber}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{phase.phaseName}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#64748b', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span>🔁 {phase.repeatWeeks} {phase.repeatWeeks === 1 ? 'week' : 'weeks'}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>{phase.weekRange}</span>
        </div>
      </div>
      {/* 2-column day grid via flexbox — more reliable than CSS grid in html-to-image */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {(phase.days ?? []).map((day, j) => <EDay key={j} day={day} />)}
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export interface PlanExportMeta { icon: string; text: string }

export interface PlanExportViewProps {
  plan: TrainingPlan;
  planLabel: string;
  meta: PlanExportMeta[];
  sharedBy?: string | null;
}

const PlanExportView = forwardRef<HTMLDivElement, PlanExportViewProps>(
  ({ plan, planLabel, meta, sharedBy }, ref) => (
    <div
      ref={ref}
      style={{
        width: 800,
        background: '#f8fafc',
        fontFamily: '"Sarabun", system-ui, -apple-system, sans-serif',
        padding: '32px 28px 24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-block', fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 20, padding: '3px 14px', marginBottom: 14,
        }}>
          {planLabel}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 14px', lineHeight: 1.25 }}>
          {plan.planName}
        </h1>
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: '6px 20px', fontSize: 13, color: '#64748b', marginBottom: 8,
        }}>
          {meta.map((m, i) => (
            <span key={i} style={{ whiteSpace: 'nowrap' }}>{m.icon} {m.text}</span>
          ))}
        </div>
        {sharedBy && (
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap' }}>Shared by {sharedBy}</div>
        )}
      </div>

      {/* Phases */}
      {plan.phases.map((phase, i) => (
        <EPhase key={phase.phaseNumber} phase={phase} idx={i} />
      ))}

      {/* Watermark */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>WeRunAlone</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, letterSpacing: '0.05em' }}>
          Run solo, Run free, Then We Run Alone.
        </div>
      </div>
    </div>
  )
);

PlanExportView.displayName = 'PlanExportView';
export default PlanExportView;
