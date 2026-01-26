export function LeftSidebar() {
  return (
    <div className="hidden xl:flex flex-col w-32 items-center relative z-20">
      <div className="fixed top-0 h-screen flex flex-col items-center justify-center w-32 left-[max(0px,calc(50%-700px))]">
        {/* Vertical Line */}
        <div className="absolute top-0 w-[1px] h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Animated Beam */}
        <div className="absolute top-0 w-[1px] h-40 bg-gradient-to-b from-transparent via-primary to-transparent animate-beam blur-[1px]" />

        {/* Navigation Dots */}
        <div className="flex flex-col gap-12 mt-20">
          <div className="size-2 rounded-full bg-slate-800 border border-slate-600 z-10" />
          <div className="size-2 rounded-full bg-primary shadow-[0_0_10px_#00f2ff] z-10" />
          <div className="size-2 rounded-full bg-slate-800 border border-slate-600 z-10" />
        </div>
      </div>
    </div>
  );
}
