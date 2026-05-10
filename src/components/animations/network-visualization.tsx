"use client";

import { cn } from "@/lib/utils";

export function NetworkVisualization({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-[350px] md:h-[500px] w-full flex items-center justify-center perspective-[1000px] group",
        className,
      )}
    >
      <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float preserve-3d">
        {/* Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-[100px] animate-pulse" />

        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-black border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,242,255,0.3)] flex items-center justify-center z-20 backdrop-blur-xl">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-primary animate-pulse-slow">
            hub
          </span>
        </div>

        {/* Database Node */}
        <div className="absolute top-0 right-4 md:right-10 w-12 h-12 md:w-16 md:h-16 bg-black/60 border border-primary/30 rounded-xl flex items-center justify-center backdrop-blur-md z-30 animate-[float_4s_ease-in-out_infinite_1s] shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-xl md:text-2xl text-white">
            database
          </span>
        </div>

        {/* Cloud Node */}
        <div className="absolute bottom-10 left-0 w-16 h-16 md:w-20 md:h-20 bg-black/60 border border-secondary/30 rounded-xl flex items-center justify-center backdrop-blur-md z-30 animate-[float_5s_ease-in-out_infinite_0.5s] shadow-lg shadow-secondary/20">
          <span className="material-symbols-outlined text-2xl md:text-3xl text-secondary">
            cloud_queue
          </span>
        </div>

        {/* API Node */}
        <div className="absolute bottom-20 right-0 w-10 h-10 md:w-12 md:h-12 bg-black/60 border border-white/10 rounded-lg flex items-center justify-center backdrop-blur-md z-10 animate-[float_7s_ease-in-out_infinite_2s]">
          <span className="material-symbols-outlined text-base md:text-lg text-slate-400">
            api
          </span>
        </div>

        {/* Orbit Rings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop
                offset="0%"
                style={{ stopColor: "#00f2ff", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#a855f7", stopOpacity: 1 }}
              />
            </linearGradient>
          </defs>
          <circle
            className="animate-[spin_10s_linear_infinite]"
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.5"
          />
          <circle
            className="animate-[spin_15s_linear_infinite_reverse]"
            cx="50"
            cy="50"
            r="30"
            fill="none"
            stroke="white"
            strokeDasharray="4 4"
            strokeWidth="0.2"
          />
        </svg>
      </div>
    </div>
  );
}
