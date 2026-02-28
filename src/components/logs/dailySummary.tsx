"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatDuration, calculateProgress } from "@/lib/domain"
import { Target } from "lucide-react"

type DailySummaryProps = {
    totalMinutes: number
    logCount: number
    goalMinutes?: number
}

export function DailySummary({ totalMinutes, logCount, goalMinutes = 480 }: DailySummaryProps) {
    const progress = calculateProgress(totalMinutes, goalMinutes)
    const remaining = Math.max(0, goalMinutes - totalMinutes)

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none">
            <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{formatDuration(totalMinutes)}</span>
                            <span className="text-xs text-muted-foreground">
                                {logCount} {logCount === 1 ? 'activity' : 'activities'} today
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{progress}%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {remaining > 0 ? `${formatDuration(remaining)} to go` : 'Goal reached!'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
