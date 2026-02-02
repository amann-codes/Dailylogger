"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getRecentLogs } from "@/lib/actions/getRecentLogs"
import { Log } from "@/lib/types"
import { Activity, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { duration } from "@/lib/utils"

// Helper function to detect and parse URLs from text
function parseUrlsFromText(text: string): { text: string; urls: string[] } {
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const urls = text.match(urlRegex) || []
    return { text, urls }
}

// Helper function to get domain from URL
function getDomain(url: string): string {
    try {
        const domain = new URL(url).hostname.replace('www.', '')
        return domain.length > 25 ? domain.substring(0, 25) + '...' : domain
    } catch {
        return url.length > 25 ? url.substring(0, 25) + '...' : url
    }
}

// Component to render description with clickable URLs
function DescriptionWithUrls({ description }: { description: string }) {
    const { urls } = parseUrlsFromText(description)
    
    if (urls.length === 0) {
        return <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    }

    // Render the description with embedded URL previews
    const textWithoutUrls = description.replace(/(https?:\/\/[^\s]+)/gi, '').trim()
    
    return (
        <div className="space-y-2">
            {textWithoutUrls && (
                <p className="text-xs text-muted-foreground line-clamp-2">{textWithoutUrls}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
                {urls.map((url, i) => (
                    <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors group"
                    >
                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                        <span className="text-muted-foreground group-hover:text-foreground truncate max-w-[150px]">
                            {getDomain(url)}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    )
}

// Format relative time
function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) {
        return days === 1 ? 'Yesterday' : `${days} days ago`
    }
    if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    }
    if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    }
    return 'Just now'
}

export function RecentActivities() {
    const [isExpanded, setIsExpanded] = useState(false)

    const { data: logs, isLoading, isError, error } = useQuery<Log[], Error>({
        queryKey: ["recent-logs"],
        queryFn: getRecentLogs,
    })

    return (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
            {/* Collapsed toggle button */}
            <Button
                variant="outline"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-14 w-10 rounded-l-lg rounded-r-none border-r-0 bg-black hover:bg-black/90 shadow-md"
                aria-label={isExpanded ? "Collapse recent activities" : "Expand recent activities"}
            >
                {isExpanded ? (
                    <ChevronRight className="h-5 w-5 text-white" />
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                )}
            </Button>

            {/* Expanded panel */}
            <div
                className={`bg-background border rounded-l-lg shadow-lg transition-all duration-300 overflow-hidden ${
                    isExpanded ? "w-96 opacity-100" : "w-0 opacity-0"
                }`}
            >
                <div className="p-5 h-[75vh] flex flex-col">
                    <div className="flex items-center gap-2 mb-5">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-base">Recent Activities</h3>
                        <span className="text-xs text-muted-foreground">(Last 7 days)</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : isError ? (
                            <p className="text-center text-sm text-destructive py-8">
                                {error?.message || "Failed to load activities"}
                            </p>
                        ) : !logs || logs.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">No recent activities</p>
                                <p className="text-xs text-muted-foreground/70">Start tracking your activities!</p>
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <Badge variant="secondary" className="capitalize text-sm shrink-0">
                                            {log.category}
                                        </Badge>
                                        {log.finishedAt && (
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {duration(log.startedAt, log.finishedAt)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {log.description && (
                                        <div className="mt-2">
                                            <DescriptionWithUrls description={log.description} />
                                        </div>
                                    )}
                                    
                                    <p className="text-xs text-muted-foreground/70 mt-3">
                                        {formatRelativeTime(log.startedAt)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
