'use client';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg bg-slate-200 ${className ?? ''}`} />
  );
}

function DaySkeleton() {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <SkeletonBlock className="w-2 h-2 rounded-full flex-shrink-0" />
        <SkeletonBlock className="h-4 w-16" />
        <SkeletonBlock className="h-4 w-12 ml-auto" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-14 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
    </div>
  );
}

function PhaseSkeleton({ dayCount }: { dayCount: number }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* Phase header */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-6 w-6 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <SkeletonBlock className="h-5 w-48 mb-2" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>
      </div>
      {/* Days grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: dayCount }).map((_, i) => (
          <DaySkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center py-6">
        <SkeletonBlock className="h-8 w-56 mx-auto mb-2" />
        <SkeletonBlock className="h-4 w-32 mx-auto" />
      </div>

      {/* Phase skeletons */}
      <PhaseSkeleton dayCount={3} />
      <PhaseSkeleton dayCount={3} />
      <PhaseSkeleton dayCount={3} />
    </div>
  );
}
