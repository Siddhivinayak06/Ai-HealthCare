"use client"

import { Button } from "@/components/ui/button"
import { UploadIcon, SparklesIcon } from "@/components/icons"
import Link from "next/link"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  description?: string
  showActions?: boolean
}

export function DashboardHeader({ title, subtitle, showActions = true }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between relative">
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-balance">
          <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent animate-gradient-slow">
            {title}
          </span>
        </h1>
        {subtitle && (
          <p className="text-lg lg:text-xl text-muted-foreground font-medium text-pretty max-w-2xl bg-gradient-to-r from-muted-foreground to-muted-foreground/60 bg-clip-text text-transparent">
            {subtitle}
          </p>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            asChild
            className="h-12 px-6 gap-2 bg-secondary/50 backdrop-blur-md hover:bg-secondary/80 border-border/50 transition-all duration-300 rounded-xl font-semibold shadow-sm"
          >
            <Link href="/analysis">
              <UploadIcon className="h-4 w-4" />
              Upload Scan
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 px-6 gap-2 btn-gradient text-white shadow-lg shadow-primary/30 transition-all duration-300 rounded-xl font-bold hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link href="/analysis">
              <SparklesIcon className="h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      )}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
    </div>
  )
}
