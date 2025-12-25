"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    HeartPulseIcon,
    MenuIcon,
    XIcon,
    ChartIcon,
    ScanIcon,
    UsersIcon,
    BrainIcon,
    FileTextIcon,
    ActivityIcon
} from "@/components/icons"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: ChartIcon },
    { name: "Analysis", href: "/analysis", icon: ScanIcon },
    { name: "Patients", href: "/patients", icon: UsersIcon },
    { name: "Risk", href: "/risk", icon: BrainIcon },
    { name: "Reports", href: "/reports", icon: FileTextIcon },
    { name: "Activity", href: "/activity", icon: ActivityIcon },
]

export function Navbar({ user }: { user: any }) {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
            isScrolled
                ? "bg-background/80 backdrop-blur-xl border-border/50 py-3"
                : "bg-transparent border-transparent py-5"
        )}>
            <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <HeartPulseIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tighter text-foreground leading-none">MedAI</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Diagnostics</p>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-1 bg-secondary/30 p-1.5 rounded-2xl border border-border/40 backdrop-blur-sm">
                    {navigation.map((item) => {
                        // Role-based filtering
                        if (user?.role === "patient" && item.name === "Patients") return null;

                        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                    active
                                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground/70")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                    {user && <UserMenu user={user} />}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "lg:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-2xl border-b border-border/50 transition-all duration-500 overflow-hidden",
                mobileMenuOpen ? "max-h-[500px] opacity-100 py-6" : "max-h-0 opacity-0 py-0"
            )}>
                <div className="px-6 space-y-2">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl text-base font-bold transition-all",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-secondary/50"
                            )}
                        >
                            <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                pathname === item.href ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                            )}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            {item.name}
                        </Link>
                    ))}
                    <div className="pt-4 border-t border-border/50 flex items-center justify-between px-2">
                        <p className="text-sm font-bold text-muted-foreground">Appearance</p>
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </nav>
    )
}
