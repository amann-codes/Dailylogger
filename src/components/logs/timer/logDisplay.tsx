"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFinishedLogs } from "@/lib/actions/getFinishedLogs"
import { updateLog } from "@/lib/actions/updateLog"
import { deleteLog } from "@/lib/actions/deleteLog"
import { LogWithTags, Sort } from "@/lib/types"
import { formatDuration, extractUrls, getDomain, startOfDay, endOfDay, isFutureDate, isFutureDateTime } from "@/lib/domain"
import { ArrowUpDown, CalendarFold, ChevronLeft, ChevronRight, ExternalLink, List, Loader2, Pencil, TableIcon, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STORAGE_KEY = "dailylogger-view-mode"

// Component to render tags
const TagsDisplay = ({ tags }: { tags: LogWithTags["tags"] }) => {
    if (!tags || tags.length === 0) {
        return <span className="text-xs text-muted-foreground/50">No tags</span>
    }
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

// Component to render description with URLs
const DescriptionDisplay = ({ description }: { description: string }) => {
    const urls = extractUrls(description)
    
    if (urls.length === 0) {
        return <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    }

    const textWithoutUrls = description.replace(/(https?:\/\/[^\s]+)/gi, '').trim()

    return (
        <div className="space-y-1">
            {textWithoutUrls && (
                <p className="text-xs text-muted-foreground line-clamp-1">{textWithoutUrls}</p>
            )}
            <div className="flex flex-wrap gap-1">
                {urls.slice(0, 2).map((url, i) => (
                    <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-muted hover:bg-muted/80 rounded transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="h-2.5 w-2.5" />
                        {getDomain(url)}
                    </a>
                ))}
                {urls.length > 2 && (
                    <span className="text-[10px] text-muted-foreground">+{urls.length - 2} more</span>
                )}
            </div>
        </div>
    )
}

export function LogsDisplay() {
    const [sort, setSort] = useState<Sort>(Sort.desc)
    const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)))
    const [viewMode, setViewMode] = useState<"table" | "card">("table")
    const [logToEdit, setLogToEdit] = useState<LogWithTags | null>(null)
    const [logToDelete, setLogToDelete] = useState<LogWithTags | null>(null)

    const queryClient = useQueryClient()

    // Load view preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "table" || saved === "card") {
            setViewMode(saved)
        }
    }, [])

    // Save view preference to localStorage
    const handleViewModeChange = (mode: "table" | "card") => {
        setViewMode(mode)
        localStorage.setItem(STORAGE_KEY, mode)
    }

    // Use client's day boundaries so "today" is correct in prod (server may be UTC)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    const dayStartISO = dayStart.toISOString()
    const dayEndISO = dayEnd.toISOString()

    const getLogsQuery = useQuery<LogWithTags[], Error>({
        queryKey: ["logs", sort, dayStartISO, dayEndISO],
        queryFn: () => getFinishedLogs(sort, dayStartISO, dayEndISO),
    })

    const updateLogMutation = useMutation({
        mutationFn: async (updatedData: LogWithTags) => updateLog(updatedData),
        onSuccess: () => {
            toast.success("Activity updated")
            queryClient.invalidateQueries({ queryKey: ["logs", sort, dayStartISO, dayEndISO] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["daily-total"] })
            setLogToEdit(null)
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update activity")
        },
    })

    const deleteLogMutation = useMutation({
        mutationFn: async (logId: string) => deleteLog(logId),
        onSuccess: () => {
            toast.success("Activity deleted")
            queryClient.invalidateQueries({ queryKey: ["logs", sort, dayStartISO, dayEndISO] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["daily-total"] })
            setLogToDelete(null)
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to delete activity")
        },
    })

    const handleUpdateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!logToEdit) return

        const formData = new FormData(event.currentTarget)
        const description = formData.get("description") as string
        const startTimeString = formData.get("startedAt") as string
        const finishTimeString = formData.get("finishedAt") as string

        const newStartedAt = new Date(logToEdit.startedAt)
        if (startTimeString) {
            const [hours, minutes] = startTimeString.split(':').map(Number)
            newStartedAt.setHours(hours, minutes, 0, 0)
        }
        if (isFutureDateTime(newStartedAt)) {
            const now = new Date()
            newStartedAt.setTime(now.getTime())
        }

        let newFinishedAt: Date | null = null
        if (finishTimeString) {
            const baseDate = logToEdit.finishedAt ? new Date(logToEdit.finishedAt) : new Date(logToEdit.startedAt)
            const [hours, minutes] = finishTimeString.split(':').map(Number)
            baseDate.setHours(hours, minutes, 0, 0)
            newFinishedAt = baseDate
            if (isFutureDateTime(newFinishedAt)) {
                const now = new Date()
                newFinishedAt = new Date(now.getTime())
            }
        }

        if (newFinishedAt && newStartedAt.getTime() > newFinishedAt.getTime()) {
            newStartedAt.setDate(newStartedAt.getDate() - 1)
        }

        const updatedData = {
            id: logToEdit.id,
            description: description || null,
            startedAt: newStartedAt,
            finishedAt: newFinishedAt,
            tagIds: logToEdit.tags?.map(t => t.id) || [],
            tags: logToEdit.tags || []
        }

        updateLogMutation.mutate(updatedData)
    }

    const handleDeleteConfirm = () => {
        if (!logToDelete?.id) return
        deleteLogMutation.mutate(logToDelete.id)
    }

    // Format date for display - shorter on mobile
    const formatDateDisplay = (d: Date) => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (d.toDateString() === today.toDateString()) return "Today"
        if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
        
        // Short format for mobile
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none sm:py-6 py-3 border-0 sm:border shadow-sm">
            <CardHeader className="px-3 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base sm:text-xl font-medium">Daily Activities</h2>
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
                                onClick={() => {
                                    const prev = new Date(date)
                                    prev.setDate(prev.getDate() - 1)
                                    setDate(prev)
                                }}
                                aria-label="Previous day"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-2 px-3 py-2 h-8 text-sm font-medium cursor-pointer"
                                        aria-label="Select date"
                                    >
                                        <CalendarFold className="h-3.5 w-3.5" />
                                        <span>{formatDateDisplay(date)}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="w-auto p-2 bg-background border rounded-md shadow-lg">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        disabled={(d) => isFutureDate(d)}
                                        onSelect={(newDate) => {
                                            if (newDate) {
                                                const normalized = new Date(newDate)
                                                normalized.setHours(0, 0, 0, 0)
                                                setDate(isFutureDate(normalized) ? startOfDay(new Date()) : normalized)
                                            } else {
                                                setDate(startOfDay(new Date()))
                                            }
                                        }}
                                        className="rounded-md border-none"
                                    />
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer"
                                disabled={startOfDay(date).getTime() >= startOfDay(new Date()).getTime()}
                                onClick={() => {
                                    const next = new Date(date)
                                    next.setDate(next.getDate() + 1)
                                    if (!isFutureDate(next)) setDate(next)
                                }}
                                aria-label="Next day"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        {getLogsQuery.data && getLogsQuery.data.length > 0 && (
                            <>
                                <div className="hidden sm:flex border rounded-md p-0.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewModeChange("card")}
                                        className={`h-7 w-7 p-0 cursor-pointer ${viewMode === "card" ? "bg-accent" : ""}`}
                                        aria-label="Card view"
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewModeChange("table")}
                                        className={`h-7 w-7 p-0 cursor-pointer ${viewMode === "table" ? "bg-accent" : ""}`}
                                        aria-label="Table view"
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <Button
                                    disabled={!getLogsQuery.data || getLogsQuery.data.length === 0}
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 cursor-pointer"
                                    onClick={() => setSort((val) => (val === Sort.desc ? Sort.asc : Sort.desc))}
                                    aria-label={sort === Sort.desc ? "Sort ascending" : "Sort descending"}
                                >
                                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="px-3 sm:px-6">
                <div className="min-h-[14rem]">
                {getLogsQuery.isLoading ? (
                    <div className="flex flex-col justify-center items-center py-12 gap-3 min-h-[14rem]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading activities…</span>
                    </div>
                ) : getLogsQuery.isError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-center min-h-[14rem] flex flex-col justify-center">
                        <p className="text-destructive text-sm font-medium">Failed to load activities</p>
                        <p className="text-muted-foreground text-xs mt-1">{getLogsQuery.error?.message}</p>
                    </div>
                ) : !getLogsQuery.data || getLogsQuery.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center min-h-[14rem]">
                        <CalendarFold className="h-10 w-10 text-muted-foreground/40 mb-2" />
                        <p className="text-muted-foreground text-sm">No activities for this date.</p>
                        <p className="text-muted-foreground/70 text-xs mt-0.5">Start an activity above to log it here.</p>
                    </div>
                ) : viewMode === "card" || typeof window !== 'undefined' && window.innerWidth < 640 ? (
                    <div className="w-full flex flex-col gap-2 sm:gap-3 max-h-[min(24rem,50vh)] overflow-y-auto">
                        {getLogsQuery.data.map((log) => (
                            <Card key={log.id} className="w-full transition-colors">
                                <CardHeader className="p-3 sm:p-4">
                                    <div className="flex flex-col gap-2 sm:gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <TagsDisplay tags={log.tags} />
                                            {log.duration !== null && log.duration !== undefined && (
                                                <span className="font-mono text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                                    {formatDuration(log.duration)}
                                                </span>
                                            )}
                                        </div>
                                        {log.description && (
                                            <DescriptionDisplay description={log.description} />
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm text-muted-foreground">
                                                {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className="flex items-center gap-1 [&_button]:cursor-pointer">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 rounded-full cursor-pointer" onClick={() => setLogToEdit(log)} aria-label="Edit activity">
                                                    <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 rounded-full cursor-pointer" onClick={() => setLogToDelete(log)} aria-label="Delete activity">
                                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[min(24rem,50vh)] w-full rounded-md border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getLogsQuery.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>
                                            <TagsDisplay tags={log.tags} />
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            {log.description ? (
                                                <DescriptionDisplay description={log.description} />
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {log.duration !== null && log.duration !== undefined ? formatDuration(log.duration) : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 [&_button]:cursor-pointer">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full cursor-pointer" onClick={() => setLogToEdit(log)} aria-label="Edit activity">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full cursor-pointer" onClick={() => setLogToDelete(log)} aria-label="Delete activity">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={!!logToEdit} onOpenChange={() => setLogToEdit(null)}>
                <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Edit Activity</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">Edit activity details.</DialogDescription>
                    </DialogHeader>
                    {logToEdit && (
                        <form onSubmit={handleUpdateSubmit} className="grid gap-3 sm:gap-4 py-2 sm:py-4">
                            <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-start gap-2 sm:gap-4">
                                <Label className="sm:text-right text-xs sm:text-sm sm:pt-2">Tags</Label>
                                <div className="sm:col-span-3">
                                    <TagsDisplay tags={logToEdit.tags} />
                                </div>
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-start gap-2 sm:gap-4">
                                <Label htmlFor="description" className="sm:text-right text-xs sm:text-sm sm:pt-2">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={logToEdit.description || ''}
                                    placeholder="Add description, notes, or URL..."
                                    className="sm:col-span-3 min-h-[70px] sm:min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="startedAt" className="sm:text-right text-xs sm:text-sm">Started</Label>
                                <Input
                                    id="startedAt"
                                    name="startedAt"
                                    type="time"
                                    defaultValue={new Date(logToEdit.startedAt).toTimeString().slice(0, 5)}
                                    className="sm:col-span-3 h-9"
                                />
                            </div>
                            <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
                                <Label htmlFor="finishedAt" className="sm:text-right text-xs sm:text-sm">Finished</Label>
                                <Input
                                    id="finishedAt"
                                    name="finishedAt"
                                    type="time"
                                    defaultValue={logToEdit.finishedAt ? new Date(logToEdit.finishedAt).toTimeString().slice(0, 5) : ''}
                                    className="sm:col-span-3 h-9"
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="submit" size="sm" className="w-full sm:w-auto" disabled={updateLogMutation.isPending}>
                                    {updateLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!logToDelete} onOpenChange={() => setLogToDelete(null)}>
                <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] mx-4">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Delete Activity?</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            This will permanently delete this activity.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 pt-2">
                        <DialogClose asChild><Button variant="outline" size="sm" className="flex-1 sm:flex-none">Cancel</Button></DialogClose>
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={handleDeleteConfirm} disabled={deleteLogMutation.isPending}>
                            {deleteLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
