"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, History } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", label: "Activity", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const

export function BottomNav() {
    const pathname = usePathname()

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            aria-label="Main navigation"
        >
            <div className="flex h-14 sm:h-16 items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 safe-area-pb">
                <div className="flex items-center rounded-full border bg-muted/30 p-1 shadow-sm">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive =
                            pathname === href || (href !== "/" && pathname.startsWith(href))
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer",
                                    isActive
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                {label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
