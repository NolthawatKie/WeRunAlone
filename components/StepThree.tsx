'use client';

import { useState, useEffect } from 'react';

interface StepThreeProps {
  hrMax: number | null;
  onHrMaxChange: (v: number | null) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepThree({ hrMax, onHrMaxChange, onBack, onNext }: StepThreeProps) {
  const [hrMode, setHrMode] = useState<'known' | 'calculate'>('calculate');
  const [knownBpm, setKnownBpm] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const calculatedHr =
    hrMode === 'calculate' && age && age > 0
      ? gender === 'male' ? 220 - age : 226 - age
      : null;

  const effectiveHrMax = hrMode === 'known' ? knownBpm : calculatedHr;

  useEffect(() => {
    onHrMaxChange(effectiveHrMax ?? null);
  }, [effectiveHrMax]);

  return (
    <div>
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-widest bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
          Step 3 of 4
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-900">Heart Rate Max</h2>
        <p className="text-slate-500 text-sm mt-1">Used to calculate accurate training zones and paces</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'calculate', label: 'Calculate from age', desc: "Don't know my HR Max", icon: '🔢' },
            { id: 'known',     label: 'Enter manually',    desc: 'I know my HR Max',     icon: '❤️' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setHrMode(opt.id as 'known' | 'calculate')}
              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                hrMode === opt.id
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-slate-200 bg-slate-50 hover:border-rose-300'
              }`}
            >
              <div className="text-2xl mb-2">{opt.icon}</div>
              <div className="font-semibold text-slate-800 text-sm">{opt.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Known BPM input */}
        {hrMode === 'known' && (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={100}
              max={220}
              value={knownBpm ?? ''}
              onChange={(e) => setKnownBpm(e.target.value ? Number(e.target.value) : null)}
              placeholder="e.g. 185"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
            />
            <span className="text-slate-500 text-sm flex-shrink-0">bpm</span>
          </div>
        )}

        {/* Calculate from age */}
        {hrMode === 'calculate' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Age</label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={age ?? ''}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : null)}
                  placeholder="e.g. 30"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Sex</label>
                <div className="grid grid-cols-2 gap-2 h-[46px]">
                  {[
                    { id: 'male', label: 'Male' },
                    { id: 'female', label: 'Female' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGender(g.id as 'male' | 'female')}
                      className={`rounded-xl text-sm font-medium cursor-pointer transition-all ${
                        gender === g.id
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                          : 'bg-white border border-slate-300 text-slate-500 hover:border-rose-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {calculatedHr && (
              <div className="flex items-center gap-4 bg-rose-50 border border-rose-200 rounded-xl px-5 py-4">
                <span className="text-rose-500 text-2xl">❤️</span>
                <div className="flex-1">
                  <span className="text-xs text-slate-500">Estimated HR Max</span>
                  <div className="font-bold text-rose-600 text-3xl leading-none mt-0.5">
                    {calculatedHr} <span className="text-base font-normal text-slate-500">bpm</span>
                  </div>
                </div>
                <span className="text-sm text-slate-400">{gender === 'male' ? '220' : '226'} − {age}</span>
              </div>
            )}

            {/* HR Zones preview */}
            {calculatedHr && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">Your training zones</p>
                {[
                  { zone: 'Z1', label: 'Recovery',   pct: '50–60%', range: `${Math.round(calculatedHr * 0.5)}–${Math.round(calculatedHr * 0.6)}`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { zone: 'Z2', label: 'Aerobic',    pct: '60–70%', range: `${Math.round(calculatedHr * 0.6)}–${Math.round(calculatedHr * 0.7)}`, color: 'bg-sky-100 text-sky-700 border-sky-200' },
                  { zone: 'Z3', label: 'Tempo',      pct: '70–80%', range: `${Math.round(calculatedHr * 0.7)}–${Math.round(calculatedHr * 0.8)}`, color: 'bg-orange-100 text-orange-700 border-orange-200' },
                  { zone: 'Z4', label: 'Threshold',  pct: '80–90%', range: `${Math.round(calculatedHr * 0.8)}–${Math.round(calculatedHr * 0.9)}`, color: 'bg-red-100 text-red-700 border-red-200' },
                  { zone: 'Z5', label: 'VO₂max',     pct: '90–100%', range: `${Math.round(calculatedHr * 0.9)}+`,                                 color: 'bg-purple-100 text-purple-700 border-purple-200' },
                ].map((z) => (
                  <div key={z.zone} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${z.color}`}>
                    <span className="font-bold w-6">{z.zone}</span>
                    <span className="flex-1">{z.label}</span>
                    <span className="font-semibold">{z.range} bpm</span>
                    <span className="opacity-60">{z.pct}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status note */}
        {!effectiveHrMax && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 text-xs text-center">
            ⚠️ <span className="font-semibold">HR Max is required.</span> Enter your age to calculate, or type it manually.
          </div>
        )}
        {effectiveHrMax && (
          <p className="text-xs text-emerald-700 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            ✓ Using HR Max = {effectiveHrMax} bpm for pace calculation
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl border border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400 font-medium text-sm cursor-pointer"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!effectiveHrMax}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
            effectiveHrMax
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Next → Review Plan
        </button>
      </div>
    </div>
  );
}
