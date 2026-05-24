import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[size:50px_50px] bg-grid-pattern opacity-[0.07] pointer-events-none" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 pt-28 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)]">
        {/* Header */}
        <div className="mb-12 sm:mb-24 relative">
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 md:h-24 w-3/4 max-w-2xl" />
          </div>
          <SkeletonText lines={2} className="max-w-2xl" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
          {/* Articles */}
          <div className="lg:col-span-8 flex flex-col gap-8 sm:gap-12">
            {/* Filter Tabs */}
            <div className="border-b border-white/10 mb-4 sticky top-24 z-40 bg-obsidian/95 backdrop-blur py-4 flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 skew-x-[-10deg]" />
              ))}
            </div>

            {/* Posts Skeleton */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row gap-5 sm:gap-8 items-stretch border border-white/5 bg-surface-dark p-4 sm:p-6"
              >
                {/* Image */}
                <Skeleton className="md:w-5/12 w-full shrink-0 h-48 sm:h-64 md:h-auto" />

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-full" />
                    <SkeletonText lines={3} />
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </aside>
        </div>
      </main>
    </>
  );
}
