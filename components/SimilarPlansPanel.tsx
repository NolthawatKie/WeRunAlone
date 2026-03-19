'use client';

interface SimilarPlan {
  id: string;
  plan_name: string;
  target: string;
  level: string;
  weeks: number;
  shared_by: string | null;
  download_count: number;
}

interface SimilarPlansPanelProps {
  plans: SimilarPlan[];
  loadingId: string | null;
  viewingId: string | null;
  onUseThisPlan: (id: string) => void;
  onViewPlan: (id: string) => void;
  onGenerateNew: () => void;
  onBack: () => void;
}

export default function SimilarPlansPanel({
  plans,
  loadingId,
  viewingId,
  onUseThisPlan,
  onViewPlan,
  onGenerateNew,
  onBack,
}: SimilarPlansPanelProps) {
  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
      >
        ← Back to review
      </button>

      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center text-xs font-semibold text-blue-600 uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
          Similar Plans Found
        </span>
        <h2 className="text-2xl font-bold mt-3 text-slate-900">We found plans like yours</h2>
        <p className="text-slate-500 text-sm mt-1">
          Other runners already trained for this. Use one directly or generate your own.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {plans.slice(0, 3).map((plan) => {
          const isLoadingThis = loadingId === plan.id;
          const isViewingThis = viewingId === plan.id;
          const levelBadge =
            plan.level === 'intermediate'
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

          return (
            <div
              key={plan.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col"
            >
              <div className="font-semibold text-slate-900 mb-2">{plan.plan_name}</div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                  {plan.target}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelBadge}`}>
                  {plan.level === 'intermediate' ? 'Experienced' : 'Beginner'}
                </span>
                <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                  {plan.weeks}w
                </span>
              </div>

              {/* Shared by / downloads */}
              <div className="text-xs text-slate-400 mb-4 mt-auto">
                {plan.shared_by ? (
                  <span>Shared by {plan.shared_by}</span>
                ) : (
                  <span>Anonymous</span>
                )}
                {' · '}
                <span>{plan.download_count} uses</span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onUseThisPlan(plan.id)}
                  disabled={isLoadingThis || loadingId !== null}
                  className="w-full py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoadingThis ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Use This Plan'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onViewPlan(plan.id)}
                  disabled={isViewingThis || viewingId !== null}
                  className="w-full py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isViewingThis ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'View Plan'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate new */}
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-3">None of these work?</p>
        <button
          type="button"
          onClick={onGenerateNew}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800 text-sm font-medium cursor-pointer"
        >
          Generate New Plan →
        </button>
      </div>
    </div>
  );
}
