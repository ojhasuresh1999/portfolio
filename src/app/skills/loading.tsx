import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function SkillsLoading() {
  return (
    <main className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 pt-28 sm:pt-32">
      {/* Header Section */}
      <div className="relative w-full max-w-[960px] flex flex-col items-center text-center mb-16 space-y-4">
        <Skeleton className="h-8 w-32 rounded-full" />
        <Skeleton className="h-16 w-3/4 max-w-2xl" />
        <SkeletonText lines={2} className="max-w-2xl" />
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-[960px]">
        {/* Core Runtime */}
        <div className="md:col-span-2 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-5 sm:p-6 md:p-8 flex flex-col md:flex-row gap-5 sm:gap-6">
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-8 w-48" />
              <SkeletonText lines={3} />
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/3 min-h-[160px] rounded-lg bg-surface-dark border border-white/5"></div>
        </div>

        {/* Languages */}
        <div className="md:row-span-2 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-5 sm:p-6 md:p-8 flex flex-col space-y-6">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex-1 flex flex-col gap-6 w-full mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-full space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Databases */}
        <div className="overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 flex flex-col justify-between min-h-[240px] space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>
        </div>

        {/* DevOps & Cloud */}
        <div className="overflow-hidden rounded-xl bg-card-dark border border-white/5 p-6 flex flex-col justify-between min-h-[240px] space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-16" />
              ))}
            </div>
          </div>
        </div>

        {/* Architecture Patterns */}
        <div className="md:col-span-3 overflow-hidden rounded-xl bg-card-dark border border-white/5 p-5 sm:p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-48" />
            </div>
            <SkeletonText lines={3} className="max-w-xl" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="w-full md:w-64 h-32 rounded-lg bg-surface-dark/50 border border-white/5" />
        </div>
      </div>
    </main>
  );
}
