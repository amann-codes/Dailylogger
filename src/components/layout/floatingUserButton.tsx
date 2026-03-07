"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, History } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserButton } from "./userButton"

const navItems = [
    { href: "/", label: "Activity", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const

export function FloatingUserButton() {
    const pathname = usePathname()

    return (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 sm:top-5 sm:right-5 sm:gap-2.5">
            <nav
                className="flex items-center rounded-full border border-border bg-background/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
                aria-label="Main navigation"
            >
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive =
                        pathname === href || (href !== "/" && pathname.startsWith(href))
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer",
                                isActive
                                    ? "bg-muted text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {label}
                        </Link>
                    )
                })}
            </nav>
            <UserButton />
        </div>
    )
}
