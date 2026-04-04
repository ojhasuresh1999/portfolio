"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden my-6 border border-white/10 shadow-2xl bg-[#0d1117] font-[family-name:var(--font-mono)]">
      {/* Top Bar with Mac Controls and Copy Button */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-white/5">
        {/* Mac window controls */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>

        {/* Language and Copy Button */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95"
            title="Copy code"
            aria-label="Copy code"
          >
            {copied ? (
              <span className="material-symbols-outlined text-[16px] text-green-400">
                check
              </span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">
                content_copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative">
        <SyntaxHighlighter
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={vscDarkPlus as any}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
