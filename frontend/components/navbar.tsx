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
    ActivityIcon,
    CalendarIcon
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
    { name: "Appointments", href: "/appointments", icon: CalendarIcon },
]

export function Navbar({ user }: { user: any }) {
    const pathname = usePathname()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <>
            <nav className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out border-b",
                isScrolled
                    ? "bg-background/80 backdrop-blur-2xl border-border/40 shadow-sm py-2"
                    : "bg-transparent border-transparent py-4"
            )}>
                <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-3 group relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                                <HeartPulseIcon className="h-6 w-6 text-white stroke-[2.5] animate-heartbeat" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-xl tracking-tight text-foreground leading-none">MedAI</span>
                                <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest pl-0.5">Diagnostics</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Pill Design */}
                    <div className="hidden lg:flex items-center justify-center flex-1 px-8">
                        <div className={cn(
                            "flex items-center gap-1 p-1.5 rounded-full transition-all duration-500 border",
                            isScrolled
                                ? "bg-secondary/40 backdrop-blur-md border-border/20 shadow-inner"
                                : "bg-background/40 backdrop-blur-md border-white/10 shadow-lg shadow-black/5"
                        )}>
                            {navigation.map((item) => {
                                if (user?.role === "patient" && item.name === "Patients") return null

                                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 group",
                                            active
                                                ? "text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {active && (
                                            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-md shadow-indigo-500/25 -z-10 animate-in zoom-in-95 duration-300" />
                                        )}
                                        <item.icon className={cn(
                                            "h-4 w-4 transition-colors duration-300",
                                            active ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-border/20">
                            <ThemeToggle />
                        </div>

                        <div className="pl-2">
                            {user && <UserMenu user={user} />}
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="lg:hidden p-2.5 rounded-full bg-secondary/50 border border-border/50 hover:bg-secondary transition-all active:scale-95"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={cn(
                "fixed inset-0 z-40 bg-background/80 backdrop-blur-3xl transition-all duration-500 lg:hidden",
                mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}>
                <div className={cn(
                    "flex flex-col h-full pt-28 px-6 pb-6 transition-transform duration-500",
                    mobileMenuOpen ? "translate-y-0" : "-translate-y-10"
                )}>
                    <div className="grid gap-2">
                        {navigation.map((item, i) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all border",
                                    pathname === item.href
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-secondary/30 text-muted-foreground border-transparent hover:bg-secondary/50"
                                )}
                                style={{ transitionDelay: `${i * 50}ms` }}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center",
                                    pathname === item.href ? "bg-primary/20 text-primary" : "bg-background/50 text-muted-foreground"
                                )}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-border/50">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30">
                            <span className="font-semibold text-muted-foreground">Appearance</span>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
