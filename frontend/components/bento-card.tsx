import type React from "react"
import { cn } from "@/lib/utils"

interface BentoCardProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "feature" | "highlight"
}

export function BentoCard({ children, className, size = "md", variant = "default" }: BentoCardProps) {
  return (
    <div
      className={cn(
        "bento-card p-6",
        size === "sm" && "p-4",
        size === "lg" && "p-8",
        size === "xl" && "p-8 lg:p-10",
        variant === "feature" && "bg-gradient-to-br from-primary/5 via-card to-card",
        variant === "highlight" && "ring-1 ring-primary/20",
        className,
      )}
    >
      {children}
    </div>
  )
}
