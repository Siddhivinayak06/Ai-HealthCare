"use client"

import { Button } from "@/components/ui/button"
import { UploadIcon, SparklesIcon } from "@/components/icons"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  description?: string
  showActions?: boolean
  breadcrumbs?: { label: string; href?: string }[]
}

export function DashboardHeader({ title, subtitle, showActions = true, breadcrumbs }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between relative animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="space-y-1.5">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/60 mb-2">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            <Home className="h-3.5 w-3.5" />
          </Link>
          {breadcrumbs?.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className={i === breadcrumbs.length - 1 ? "text-foreground font-bold" : "hover:text-primary transition-colors"}>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
              </span>
            </div>
          ))}
        </div>

        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground/90 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base lg:text-lg text-muted-foreground font-medium text-pretty max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {showActions && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            asChild
            className="h-10 px-5 gap-2 bg-background/50 backdrop-blur-md border-border/50 hover:bg-secondary/50 hover:border-border transition-all duration-300 rounded-xl font-semibold shadow-sm text-sm"
          >
            <Link href="/analysis">
              <UploadIcon className="h-4 w-4" />
              Upload Scan
            </Link>
          </Button>
          <Button
            asChild
            className="h-10 px-5 gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Link href="/analysis">
              <SparklesIcon className="h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
