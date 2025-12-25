"use client"

import { BentoCard } from "./bento-card"
import { BrainIcon, SparklesIcon } from "./icons"

export function AIStatus() {
  return (
    <div className="health-card p-6 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000 pointer-events-none animate-pulse" />

      <div className="relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/30 relative">
            <BrainIcon className="h-7 w-7 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-background"></span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">AI Diagnostics</h3>
            <p className="text-xs text-emerald-500 font-black uppercase tracking-widest">Active System</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 hover:border-primary/30 transition-all">
              <p className="text-2xl font-black text-foreground tracking-tighter">89%</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Accuracy</p>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/40 border border-border/50 hover:border-primary/30 transition-all">
              <p className="text-2xl font-black text-foreground tracking-tighter">2.3s</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Latency</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between group/status">
            <div className="flex items-center gap-3">
              <SparklesIcon className="h-4 w-4 text-primary group-hover/status:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Model Status</span>
            </div>
            <span className="text-xs font-black text-primary">OPTIMIZED</span>
          </div>
        </div>
      </div>
    </div>
  )
}
