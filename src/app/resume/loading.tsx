import { Skeleton } from "@/components/ui/skeleton";

export default function ResumeLoading() {
  return (
    <main className="flex-1 px-4 sm:px-6 py-28 sm:py-32 flex flex-col items-center justify-center min-h-[85vh] relative z-10 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-8 gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-48 rounded-lg" />
      </div>

      <div className="w-full max-w-5xl h-[60vh] sm:h-[75vh] rounded-xl overflow-hidden border border-white/10 bg-white/5">
        <Skeleton className="w-full h-full rounded-none bg-white/10" />
      </div>
    </main>
  );
}
