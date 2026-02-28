"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllLogs } from "@/lib/actions/getAllLogs"
import { updateLog } from "@/lib/actions/updateLog"
import { deleteLog } from "@/lib/actions/deleteLog"
import { getTags } from "@/lib/actions/tags"
import { LogWithTags, Sort } from "@/lib/types"
import { formatDuration, extractUrls, getDomain } from "@/lib/domain"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    History,
    List,
    Loader2,
    Pencil,
    Search,
    TableIcon,
    Trash2,
    X,
    BarChart3
} from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "dailylogger-history-view-mode"

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
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-muted hover:bg-muted/80 rounded transition-colors"
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

// Format date for display
const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

export function HistoryPage() {
    const [sort, setSort] = useState<Sort>(Sort.desc)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [searchInput, setSearchInput] = useState("")
    const [selectedTagId, setSelectedTagId] = useState<string | undefined>()
    const [viewMode, setViewMode] = useState<"table" | "card">("table")
    const [logToEdit, setLogToEdit] = useState<LogWithTags | null>(null)
    const [logToDelete, setLogToDelete] = useState<LogWithTags | null>(null)
    const limit = 15

    const queryClient = useQueryClient()

    // Load view preference
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "table" || saved === "card") {
            setViewMode(saved)
        }
    }, [])

    const handleViewModeChange = (mode: "table" | "card") => {
        setViewMode(mode)
        localStorage.setItem(STORAGE_KEY, mode)
    }

    const tagsQuery = useQuery({
        queryKey: ["tags"],
        queryFn: getTags
    })

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["all-logs", sort, page, search, selectedTagId],
        queryFn: () => getAllLogs({ sort, page, limit, search, tagId: selectedTagId }),
    })

    const updateLogMutation = useMutation({
        mutationFn: async (updatedData: LogWithTags) => updateLog(updatedData),
        onSuccess: () => {
            toast.success("Activity updated")
            queryClient.invalidateQueries({ queryKey: ["all-logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            setLogToEdit(null)
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update")
        },
    })

    const deleteLogMutation = useMutation({
        mutationFn: async (logId: string) => deleteLog(logId),
        onSuccess: () => {
            toast.success("Activity deleted")
            queryClient.invalidateQueries({ queryKey: ["all-logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            setLogToDelete(null)
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to delete")
        },
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearch(searchInput)
        setPage(1)
    }

    const clearSearch = () => {
        setSearchInput("")
        setSearch("")
        setPage(1)
    }

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

        let newFinishedAt: Date | null = null
        if (finishTimeString) {
            const baseDate = logToEdit.finishedAt ? new Date(logToEdit.finishedAt) : new Date(logToEdit.startedAt)
            const [hours, minutes] = finishTimeString.split(':').map(Number)
            baseDate.setHours(hours, minutes, 0, 0)
            newFinishedAt = baseDate
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

    const logs = data?.logs || []
    const totalPages = data?.totalPages || 1
    const total = data?.total || 0

    return (
        <div className="flex flex-col min-h-screen w-full sm:items-center sm:justify-start sm:space-y-4 sm:pt-8 pt-4 pb-8 px-0 sm:px-4 bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
            <Header />
            
            <Card className="max-w-4xl w-full sm:rounded-xl rounded-none sm:py-6 py-3">
                <CardHeader className="flex flex-col gap-3 sm:gap-4 px-3 sm:px-6">
                    <div className="flex flex-row justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span className="text-base sm:text-xl font-medium">History</span>
                            {total > 0 && (
                                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                    {total}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link href="/analytics">
                                <Button variant="outline" size="sm" className="gap-1.5 h-8 px-2 sm:px-3 text-xs sm:text-sm">
                                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Analytics</span>
                                </Button>
                            </Link>
                            {logs.length > 0 && (
                                <div className="hidden sm:flex border rounded-md p-0.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewModeChange("card")}
                                        className={`h-7 w-7 p-0 ${viewMode === "card" ? "bg-accent" : ""}`}
                                    >
                                        <List className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewModeChange("table")}
                                        className={`h-7 w-7 p-0 ${viewMode === "table" ? "bg-accent" : ""}`}
                                    >
                                        <TableIcon className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                            <Button
                                disabled={logs.length === 0}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                    setSort((val) => (val === Sort.desc ? Sort.asc : Sort.desc))
                                    setPage(1)
                                }}
                            >
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

                    {/* Tag filter */}
                    {tagsQuery.data && tagsQuery.data.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 -mx-1 px-1 overflow-x-auto pb-1">
                            <button
                                onClick={() => { setSelectedTagId(undefined); setPage(1) }}
                                className={`px-2 py-1 text-[11px] sm:text-xs rounded-full border transition-colors whitespace-nowrap ${
                                    !selectedTagId ? 'bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground'
                                }`}
                            >
                                All
                            </button>
                            {tagsQuery.data.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => { setSelectedTagId(tag.id); setPage(1) }}
                                    className={`px-2 py-1 text-[11px] sm:text-xs rounded-full border transition-colors whitespace-nowrap ${
                                        selectedTagId === tag.id
                                            ? 'border-transparent text-white'
                                            : 'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground'
                                    }`}
                                    style={selectedTagId === tag.id ? { backgroundColor: tag.color } : {}}
                                >
                                    {tag.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9 pr-9 h-9 text-sm"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="secondary" size="sm" className="h-9">
                            Search
                        </Button>
                    </form>

                    {search && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span>Results for "{search}"</span>
                            <button onClick={clearSearch} className="text-xs underline hover:text-foreground">
                                Clear
                            </button>
                        </div>
                    )}
                </CardHeader>

                <Separator />

                <CardContent className="px-3 sm:px-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12 sm:py-16">
                            <Loader2 className="animate-spin h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                    ) : isError ? (
                        <p className="text-center py-12 sm:py-16 text-destructive text-sm">{error?.message}</p>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <History className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground text-sm">
                                {search || selectedTagId ? "No activities found." : "No activities logged yet."}
                            </p>
                        </div>
                    ) : viewMode === "card" || typeof window !== 'undefined' && window.innerWidth < 640 ? (
                        <div className="w-full flex flex-col gap-2 sm:gap-3 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto">
                            {logs.map((log) => (
                                <Card key={log.id} className="w-full transition-colors hover:bg-muted/30">
                                    <CardHeader className="p-3 sm:py-3 sm:px-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                    <TagsDisplay tags={log.tags} />
                                                    <span className="text-[11px] sm:text-xs text-muted-foreground">
                                                        {formatDate(log.startedAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                                    {log.duration !== null && log.duration !== undefined && (
                                                        <span className="font-mono text-xs sm:text-sm text-muted-foreground">
                                                            {formatDuration(log.duration)}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 rounded-full" onClick={() => setLogToEdit(log)}>
                                                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 bg-gray-200 rounded-full" onClick={() => setLogToDelete(log)}>
                                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            {log.description && (
                                                <DescriptionDisplay description={log.description} />
                                            )}
                                        </div>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-y-auto max-h-[60vh] w-full rounded-md border">
                            <Table className="w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tags</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
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
                                            <TableCell className="text-sm">
                                                {formatDate(log.startedAt)}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {log.duration !== null && log.duration !== undefined ? formatDuration(log.duration) : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToEdit(log)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToDelete(log)}>
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

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                {page}/{totalPages}
                            </span>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 sm:px-3"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-1">Previous</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 sm:px-3"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <span className="hidden sm:inline mr-1">Next</span>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

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
                                    placeholder="Add description..."
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
                        <DialogClose asChild>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none" onClick={handleDeleteConfirm} disabled={deleteLogMutation.isPending}>
                            {deleteLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
