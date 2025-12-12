"use client"

import { BentoCard } from "./bento-card"
import { BrainIcon, SparklesIcon } from "./icons"

export function AIStatus() {
  return (
    <BentoCard variant="feature" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <BrainIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">AI Diagnostics</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs text-success font-medium">Online</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-2xl font-bold text-card-foreground">89%</p>
            <p className="text-xs text-muted-foreground">Accuracy</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-2xl font-bold text-card-foreground">2.3s</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <span>Powered by advanced ML models</span>
        </div>
      </div>
    </BentoCard>
  )
}
