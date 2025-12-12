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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight text-balance">{title}</h1>
        {subtitle && <p className="text-base lg:text-lg text-muted-foreground text-pretty max-w-xl">{subtitle}</p>}
      </div>
      {showActions && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            asChild
            className="gap-2 bg-transparent hover:bg-accent/50 border-border/50 transition-all duration-200"
          >
            <Link href="/imaging">
              <UploadIcon className="h-4 w-4" />
              Upload Scan
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Link href="/imaging">
              <SparklesIcon className="h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
