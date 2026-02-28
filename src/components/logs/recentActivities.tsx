"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getRecentLogs } from "@/lib/actions/getRecentLogs"
import { LogWithTags } from "@/lib/types"
import { Activity, ChevronRight, ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDuration, formatRelativeTime, extractUrls, getDomain } from "@/lib/domain"

// Component to render description with clickable URLs
function DescriptionWithUrls({ description }: { description: string }) {
    const urls = extractUrls(description)
    const textWithoutUrls = description.replace(/(https?:\/\/[^\s]+)/gi, '').trim()
    
    if (urls.length === 0) {
        return <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    }

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

// Component to render tags
function TagsDisplay({ tags }: { tags: LogWithTags["tags"] }) {
    if (!tags || tags.length === 0) return null
    return (
        <div className="flex flex-wrap gap-1">
            {tags.map(tag => (
                <Badge
                    key={tag.id}
                    style={{ backgroundColor: tag.color }}
                    className="text-white text-xs"
                >
                    {tag.name}
                </Badge>
            ))}
        </div>
    )
}

export function RecentActivities() {
    const [isExpanded, setIsExpanded] = useState(false)

    const { data: logs, isLoading, isError, error, isFetching } = useQuery<LogWithTags[], Error>({
        queryKey: ["recent-logs"],
        queryFn: getRecentLogs,
        staleTime: 0,
        refetchOnMount: true,
    })

    return (
        <>
            {/* Desktop: Side panel */}
            <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 items-center">
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
                        <Activity className="h-5 w-5 text-white" />
                    )}
                </Button>

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
                            {isFetching && !isLoading && (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
                            )}
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
                                            <TagsDisplay tags={log.tags} />
                                            {log.duration !== null && log.duration !== undefined && (
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {formatDuration(log.duration)}
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
        </>
    )
}
