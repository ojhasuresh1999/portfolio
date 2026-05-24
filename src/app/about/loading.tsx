import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="flex w-full max-w-[1400px] mx-auto flex-1 pb-16 sm:pb-24 pt-24 sm:pt-32 relative z-10 font-[family-name:var(--font-mono)] px-4 sm:px-6">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />

      <main className="w-full max-w-5xl mx-auto space-y-16 sm:space-y-32">
        {/* Header section */}
        <section className="flex flex-col md:flex-row gap-12 sm:gap-20 items-start md:items-center relative z-10">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 md:h-24 w-full" />
            <SkeletonText lines={4} className="max-w-2xl text-lg" />
            <div className="flex gap-4 pt-6">
              <Skeleton className="h-12 w-40 rounded-full" />
              <Skeleton className="h-12 w-32 rounded-full" />
            </div>
          </div>
          <div className="w-full md:w-5/12 max-w-sm aspect-square relative rounded-2xl overflow-hidden shrink-0">
            <Skeleton className="w-full h-full rounded-2xl" />
          </div>
        </section>

        {/* Story Section */}
        <section className="space-y-8 relative z-10">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
            <div className="space-y-6">
              <SkeletonText lines={6} />
              <SkeletonText lines={5} />
            </div>
            <div className="space-y-6">
              <SkeletonText lines={5} />
              <div className="bg-white/5 p-6 border-l-2 border-primary">
                <SkeletonText lines={3} />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="relative z-10">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
            <div className="space-y-8">
              <SkeletonText lines={3} />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 border border-white/5">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#020203] border border-white/5 p-6 sm:p-8 rounded-2xl">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full bg-white/5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full bg-white/5" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-32 w-full bg-white/5" />
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
