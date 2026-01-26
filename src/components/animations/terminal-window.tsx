"use client";

import { cn } from "@/lib/utils";

interface TerminalWindowProps {
  command?: string;
  output?: string[];
  className?: string;
}

export function TerminalWindow({
  command = "init backend_protocol --force",
  output = [
    "> Loading modules... OK",
    "> Connecting to neural net... OK",
    "> Launching interface...",
  ],
  className,
}: TerminalWindowProps) {
  return (
    <div className={cn("w-fit", className)}>
      {/* Title Bar */}
      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-t-lg px-4 py-2 w-full max-w-md">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-red-500/80" />
          <div className="size-2.5 rounded-full bg-yellow-500/80" />
          <div className="size-2.5 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[10px] text-slate-500 font-[family-name:var(--font-mono)] ml-2">
          bash — 80x24
        </span>
      </div>

      {/* Terminal Content */}
      <div className="bg-black/80 backdrop-blur-md border border-t-0 border-white/10 rounded-b-lg p-4 font-[family-name:var(--font-mono)] text-sm shadow-2xl">
        <div className="flex items-center gap-2 text-primary">
          <span>➜</span>
          <span className="text-secondary">~</span>
          <span className="typewriter-text animate-typewriter w-0">
            {command}
          </span>
        </div>
        <div className="mt-2 text-slate-400 text-xs opacity-0 animate-[fadeInUp_0.5s_ease-out_2.5s_forwards]">
          {output.map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
