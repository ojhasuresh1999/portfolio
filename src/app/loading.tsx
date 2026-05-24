import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex w-full max-w-[1400px] mx-auto flex-1">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 border-r border-white/5 bg-[#020203] relative z-20 shrink-0 h-[calc(100vh-4rem)] sticky top-16 p-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <SkeletonText lines={6} className="mb-8" />
        <Skeleton className="h-32 w-full mt-auto" />
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 w-full px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 relative z-10 space-y-24">
        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-20 sm:h-32 w-full max-w-3xl" />
          <SkeletonText lines={3} className="max-w-2xl" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>
        </section>

        {/* Tech Arsenal */}
        <section className="space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </section>

        {/* Deployments Section */}
        <section className="space-y-8">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
