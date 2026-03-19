'use client';

import { useRef, useState } from 'react';
import type { TrainingPlan, Phase, Day, Session } from '@/types/plan';
import PlanExportView, { type PlanExportMeta } from './PlanExportView';

// ─── Reused style maps (mirrors OutputPlan.tsx) ───────────────────────────────

const SESSION_STYLES: Record<string, { bg: string; ring: string; dot: string; label: string }> = {
  warmup:      { bg: 'bg-emerald-50',  ring: 'ring-emerald-200', dot: 'bg-emerald-400', label: 'Warm Up'     },
  cooldown:    { bg: 'bg-teal-50',     ring: 'ring-teal-200',    dot: 'bg-teal-400',    label: 'Cool Down'   },
  run:         { bg: 'bg-blue-50',     ring: 'ring-blue-200',    dot: 'bg-blue-400',    label: 'Run'         },
  strength:    { bg: 'bg-violet-50',   ring: 'ring-violet-200',  dot: 'bg-violet-400',  label: 'Strength'    },
  plyometrics: { bg: 'bg-yellow-50',   ring: 'ring-yellow-200',  dot: 'bg-yellow-400',  label: 'Plyometrics' },
  rest:        { bg: 'bg-slate-50',    ring: 'ring-slate-200',   dot: 'bg-slate-300',   label: 'Rest'        },
};

const RUN_TYPE_CONFIG: Record<string, { bg: string; ring: string; dot: string; labelColor: string; tip: string }> = {
  'Easy Run':     { bg: 'bg-emerald-50', ring: 'ring-emerald-200', dot: 'bg-emerald-400', labelColor: 'text-emerald-700', tip: 'Conversational pace · Zone 1–2'                  },
  'Long Run':     { bg: 'bg-sky-50',     ring: 'ring-sky-200',     dot: 'bg-sky-400',     labelColor: 'text-sky-700',     tip: 'Slow & steady, longest run · Zone 2'             },
  'Tempo Run':    { bg: 'bg-orange-50',  ring: 'ring-orange-200',  dot: 'bg-orange-400',  labelColor: 'text-orange-700',  tip: 'Comfortably hard · Lactate threshold · Zone 3–4' },
  'Interval Run': { bg: 'bg-red-50',     ring: 'ring-red-200',     dot: 'bg-red-400',     labelColor: 'text-red-700',     tip: 'Fast bursts + rest · VO₂max · Zone 4–5'          },
  'Hill Repeat':  { bg: 'bg-purple-50',  ring: 'ring-purple-200',  dot: 'bg-purple-400',  labelColor: 'text-purple-700',  tip: 'Uphill sprints · Power & form · Zone 4'          },
};

const DAY_TYPE_CONFIG = {
  run:         { dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 ring-blue-200',      label: 'Run'      },
  strength:    { dot: 'bg-violet-400', badge: 'bg-violet-50 text-violet-700 ring-violet-200', label: 'Strength' },
  plyometrics: { dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 ring-yellow-200', label: 'Plyo'     },
  rest:        { dot: 'bg-slate-300',  badge: 'bg-slate-100 text-slate-500 ring-slate-200',   label: 'Rest'     },
};

const PHASE_ACCENTS = [
  'shadow-[inset_4px_0_0_#3b82f6]',
  'shadow-[inset_4px_0_0_#a855f7]',
  'shadow-[inset_4px_0_0_#10b981]',
  'shadow-[inset_4px_0_0_#f97316]',
  'shadow-[inset_4px_0_0_#f43f5e]',
];
const PHASE_BADGE_STYLES = [
  'bg-blue-50 text-blue-700 ring-blue-200',
  'bg-purple-50 text-purple-700 ring-purple-200',
  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'bg-orange-50 text-orange-700 ring-orange-200',
  'bg-rose-50 text-rose-700 ring-rose-200',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const runCfg = session.type === 'run' && session.runType ? RUN_TYPE_CONFIG[session.runType] : null;
  const style = runCfg
    ? { bg: runCfg.bg, ring: runCfg.ring, dot: runCfg.dot, label: session.runType! }
    : SESSION_STYLES[session.type] ?? SESSION_STYLES.rest;

  return (
    <div className={`rounded-lg ring-1 ring-inset px-3 py-2.5 ${style.bg} ${style.ring}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${runCfg ? runCfg.labelColor : 'text-slate-600'}`}>{style.label}</span>
        {session.duration > 0 && <span className="ml-auto text-xs text-slate-400">{session.duration} min</span>}
      </div>
      {runCfg && <div className={`text-xs mb-1.5 ${runCfg.labelColor} opacity-70`}>{runCfg.tip}</div>}
      {session.type === 'run' && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {session.distance != null && <span className="text-xs bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 px-2 py-0.5 rounded-full">📏 {session.distance} km</span>}
          {session.zone && <span className="text-xs bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 px-2 py-0.5 rounded-full">💓 {session.zone}</span>}
          {session.effort && <span className="text-xs bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 px-2 py-0.5 rounded-full">⚡ {session.effort}</span>}
          {session.pace && <span className="text-xs bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-300 px-2 py-0.5 rounded-full font-semibold">🏃 {session.pace}</span>}
        </div>
      )}
      {session.description && <p className="text-xs text-slate-500 leading-relaxed">{session.description}</p>}
      {(session.type === 'plyometrics' || session.type === 'strength') && session.exercises && session.exercises.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {session.exercises.map((ex, idx) => {
            const isStrength = session.type === 'strength';
            return (
              <div key={idx} className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 ring-1 ring-inset ${isStrength ? 'bg-violet-50 ring-violet-200' : 'bg-yellow-50 ring-yellow-200'}`}>
                <span className={`mt-0.5 flex-shrink-0 ${isStrength ? 'text-violet-500' : 'text-yellow-600'}`}>•</span>
                <div className="flex-1 min-w-0">
                  <span className={`font-medium ${isStrength ? 'text-violet-800' : 'text-yellow-800'}`}>{ex.name}</span>
                  <span className={`ml-2 ${isStrength ? 'text-violet-500' : 'text-yellow-600'}`}>{ex.sets} × {ex.reps} reps</span>
                  {ex.note && <p className={`mt-0.5 leading-relaxed ${isStrength ? 'text-violet-500' : 'text-yellow-600'}`}>{ex.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayCard({ day }: { day: Day }) {
  const config = DAY_TYPE_CONFIG[day.type] ?? DAY_TYPE_CONFIG.rest;
  return (
    <div className="rounded-xl bg-white ring-1 ring-inset ring-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 shadow-[inset_0_-1px_0_#e2e8f0]">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
          <span className="font-semibold text-sm text-slate-900">{day.dayName}</span>
        </div>
        <span className={`text-xs ring-1 ring-inset px-2 py-0.5 rounded-full font-medium ${config.badge}`}>{config.label}</span>
      </div>
      <div className="p-3 space-y-2">
        {day.type === 'rest' && (!day.sessions || day.sessions.length === 0) ? (
          <div className="flex items-center gap-2 py-3 text-slate-400 text-sm"><span>😴</span><span>Rest — let your body recover</span></div>
        ) : (
          day.sessions?.map((session, idx) => <SessionCard key={idx} session={session} />)
        )}
      </div>
    </div>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  const idx = (phase.phaseNumber - 1) % PHASE_ACCENTS.length;
  return (
    <div className={`rounded-2xl bg-white ring-1 ring-inset ring-slate-200 overflow-hidden ${PHASE_ACCENTS[idx]}`}>
      <div className="px-5 py-4 bg-slate-50 shadow-[inset_0_-1px_0_#e2e8f0]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-bold uppercase tracking-widest ring-1 ring-inset px-2.5 py-0.5 rounded-full flex-shrink-0 ${PHASE_BADGE_STYLES[idx]}`}>Phase {phase.phaseNumber}</span>
          <h3 className="text-base font-bold text-slate-900">{phase.phaseName}</h3>
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
            <span>🔁 {phase.repeatWeeks} {phase.repeatWeeks === 1 ? 'week' : 'weeks'}</span>
            <span className="text-slate-300">|</span>
            <span>{phase.weekRange}</span>
          </div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {(phase.days ?? []).map((day, i) => <DayCard key={i} day={day} />)}
      </div>
    </div>
  );
}

// ─── CommunityPlanModal ───────────────────────────────────────────────────────

interface CommunityPlanModalProps {
  plan: TrainingPlan;
  planName: string;
  sharedBy: string | null;
  target?: string;
  level?: string;
  weeks?: number;
  runDays?: string[];
  hrMax?: number | null;
  planId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function CommunityPlanModal({ plan, planName, sharedBy, target, level, weeks, runDays, hrMax, planId, onClose, onSaved }: CommunityPlanModalProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Build meta array for the export image header
  const exportMeta: PlanExportMeta[] = [
    ...(target ? [{ icon: '🎯', text: target }] : []),
    ...(weeks   ? [{ icon: '📆', text: `${weeks} weeks` }] : []),
    ...(level   ? [{ icon: level === 'beginner' ? '🌱' : '⚡', text: level === 'beginner' ? 'Beginner' : 'Experienced' }] : []),
    ...(hrMax   ? [{ icon: '❤️', text: `HR Max ${hrMax} bpm` }] : []),
    ...(runDays && runDays.length > 0 ? [{ icon: '📅', text: runDays.join(', ') }] : []),
  ];

  const handleExport = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const el = exportRef.current;
      const opts = {
        backgroundColor: '#f8fafc',
        pixelRatio: 2,
        cacheBust: true,
        height: el.scrollHeight,
      };

      // Ensure Sarabun is loaded before capture
      await document.fonts.ready;
      // Warmup pass — loads html-to-image's font cache
      await toPng(el, opts);
      // Real capture — correct font metrics
      const dataUrl = await toPng(el, opts);

      const fileName = `WeRunAlone-${planName.replace(/\s+/g, '-')}.png`;

      // Increment saves count (fire-and-forget)
      if (planId) {
        fetch(`/api/community/download/${planId}`, { method: 'POST' })
          .then(() => onSaved?.())
          .catch(() => {});
      }

      // Mobile (iOS / Android): Web Share API → save to photo library / files
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile && navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: planName });
            return;
          }
        } catch {
          // User cancelled or share failed — fall through to download
        }
      }

      // Desktop (Windows / macOS / Linux) and mobile fallback
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Could not save image. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex flex-col bg-slate-50 w-full h-full max-w-6xl mx-auto shadow-2xl overflow-hidden sm:my-4 sm:rounded-2xl">
        {/* Modal toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white shadow-[inset_0_-1px_0_#e2e8f0] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{planName}</p>
            {sharedBy && <p className="text-xs text-slate-500">by {sharedBy}</p>}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              exporting ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {exporting ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Saving...</>
            ) : <>Save as Image</>}
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer">
            ✕
          </button>
        </div>

        {/* Scrollable plan content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-slate-50 rounded-2xl ring-1 ring-inset ring-slate-200">
            {/* Header */}
            <div className="text-center mb-8 pt-8 px-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 ring-1 ring-inset ring-blue-200 px-3 py-1 rounded-full mb-4">
                Community Training Plan
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{plan.planName}</h1>

              {/* Overview inputs row */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-slate-500 mb-3">
                {target && <span>🎯 {target}</span>}
                {weeks && <><span className="text-slate-300">·</span><span>📆 {weeks} weeks</span></>}
                {level && <><span className="text-slate-300">·</span><span>{level === 'beginner' ? '🌱 Beginner' : '⚡ Experienced'}</span></>}
                {hrMax && <><span className="text-slate-300">·</span><span>❤️ HR Max {hrMax} bpm</span></>}
                {runDays && runDays.length > 0 && (
                  <><span className="text-slate-300">·</span><span>🗓️ {runDays.join(', ')}</span></>
                )}
              </div>

              {sharedBy && <p className="text-xs text-slate-400">Shared by {sharedBy}</p>}
            </div>
            {/* Phases */}
            <div className="space-y-5 px-4 pb-6">
              {plan.phases.map((phase) => <PhaseCard key={phase.phaseNumber} phase={phase} />)}
            </div>
            {/* Watermark */}
            <div className="mt-6 pt-6 shadow-[inset_0_1px_0_#e2e8f0] flex flex-col items-center gap-1 pb-6">
              <div className="text-xl font-bold tracking-tight text-slate-900">WeRunAlone</div>
              <div className="text-xs text-slate-400 tracking-wider">Run solo, Run free, Then We Run Alone.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen export view — captured by handleExport, never visible to user */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <PlanExportView
          ref={exportRef}
          plan={plan}
          planLabel="Community Training Plan"
          meta={exportMeta}
          sharedBy={sharedBy}
        />
      </div>
    </div>
  );
}
