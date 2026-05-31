"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function clipboardText(value: number) {
  return `Today's P/L: ${formatCurrency(value)}`;
}

export function ShareTodaysPnlButton({ todaysPnl }: { todaysPnl: number }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = clipboardText(todaysPnl);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      alert(text);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
      >
        <Share2 className="h-4 w-4 text-emerald-300" />
        Share
      </button>
      {copied ? (
        <div className="fixed right-6 top-6 z-50 rounded-full border border-emerald-300/30 bg-slate-950/95 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-xl shadow-emerald-950/30">
          Today&apos;s P/L copied
        </div>
      ) : null}
    </>
  );
}