import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.05] pointer-events-none" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 pt-28 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)]">
        {/* Header */}
        <div className="mb-12 sm:mb-20 relative">
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 md:h-24 w-3/4 max-w-2xl" />
          </div>
          <SkeletonText lines={2} className="max-w-2xl" />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-12 sm:mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col h-full bg-surface-dark border border-white/5 rounded-xl overflow-hidden"
            >
              {/* Image */}
              <Skeleton className="h-48 w-full rounded-none" />

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <SkeletonText lines={3} className="mb-6" />

                <div className="flex gap-2 mb-6">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>

                <div className="mt-auto flex justify-between border-t border-white/5 pt-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
