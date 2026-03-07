"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "./userButton"
import { Button } from "@/components/ui/button"
import { Activity, BarChart3, History } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", label: "Activity", icon: Activity },
    { href: "/history", label: "History", icon: History },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const

export function Header() {
    const pathname = usePathname()

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 sm:h-14 items-center justify-between gap-4 px-3 sm:px-6">
                <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))
                        return (
                            <Link key={href} href={href}>
                                <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "gap-1.5 h-8 px-2.5 sm:px-3 text-xs sm:text-sm font-medium",
                                        isActive && "bg-muted"
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    {label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>
                <div className="flex items-center">
                    <UserButton />
                </div>
            </div>
        </header>
    )
}
