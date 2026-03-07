"use client"

import { UserButton } from "./userButton"

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-12 sm:h-14 items-center justify-between gap-4 px-3 sm:px-6">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                    Dailylogger
                </span>
                <div className="flex items-center">
                    <UserButton />
                </div>
            </div>
        </header>
    )
}
