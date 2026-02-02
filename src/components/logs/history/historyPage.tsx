"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAllLogs } from "@/lib/actions/getAllLogs"
import { updateLog } from "@/lib/actions/updateLog"
import { deleteLog } from "@/lib/actions/deleteLog"
import { Log, Sort } from "@/lib/types"
import { duration } from "@/lib/utils"
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
    X
} from "lucide-react"

// Helper to extract URLs from text
const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    return text.match(urlRegex) || []
}

// Helper to get domain from URL
const getDomain = (url: string): string => {
    try {
        const domain = new URL(url).hostname.replace('www.', '')
        return domain.length > 20 ? domain.substring(0, 20) + '...' : domain
    } catch {
        return url.length > 20 ? url.substring(0, 20) + '...' : url
    }
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
    const [viewMode, setViewMode] = useState<"table" | "card">("table")
    const [logToEdit, setLogToEdit] = useState<Log | null>(null)
    const [logToDelete, setLogToDelete] = useState<Log | null>(null)
    const limit = 15

    const queryClient = useQueryClient()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["all-logs", sort, page, search],
        queryFn: () => getAllLogs({ sort, page, limit, search }),
    })

    const updateLogMutation = useMutation({
        mutationFn: async (updatedData: Log) => updateLog(updatedData),
        onSuccess: () => {
            toast.success("Log updated successfully!")
            queryClient.invalidateQueries({ queryKey: ["all-logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            setLogToEdit(null)
        },
        onError: (error) => {
            toast.error(`Failed to update log: ${error.message}`)
        },
    })

    const deleteLogMutation = useMutation({
        mutationFn: async (logId: string) => deleteLog(logId),
        onSuccess: () => {
            toast.success("Log deleted successfully!")
            queryClient.invalidateQueries({ queryKey: ["all-logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            setLogToDelete(null)
        },
        onError: (error) => {
            toast.error(`Failed to delete log: ${error.message}`)
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
        const category = formData.get("category") as string
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
            category: category,
            description: description || null,
            startedAt: newStartedAt,
            finishedAt: newFinishedAt,
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
        <div className="flex flex-col min-h-screen w-full sm:items-center sm:justify-start sm:space-y-4 sm:pt-8 pt-16">
            <Header />
            
            <Card className="max-w-4xl w-full sm:rounded-xl rounded-none sm:py-6 py-3">
                <CardHeader className="flex flex-col gap-4">
                    <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xl font-medium">Activity History</span>
                            {total > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                    {total} total
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {logs.length > 0 && (
                                <Card className="p-0">
                                    <CardContent className="flex flex-row items-center justify-start p-1 h-9">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode("card")}
                                            className={`${viewMode === "card" ? "bg-accent" : ""}`}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                        <Separator orientation="vertical" className="p-0 mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode("table")}
                                            className={`${viewMode === "table" ? "bg-accent" : ""}`}
                                        >
                                            <TableIcon className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                            <Button
                                disabled={logs.length === 0}
                                className="p-2 rounded-md border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors shadow-sm"
                                onClick={() => {
                                    setSort((val) => (val === Sort.desc ? Sort.asc : Sort.desc))
                                    setPage(1)
                                }}
                                aria-label={`Sort logs ${sort === Sort.desc ? "ascending" : "descending"}`}
                            >
                                <ArrowUpDown className="size-5 text-muted-foreground hover:text-primary" />
                            </Button>
                        </div>
                    </div>

                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search activities..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9 pr-9"
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
                        <Button type="submit" variant="secondary">
                            Search
                        </Button>
                    </form>

                    {search && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Results for "{search}"</span>
                            <button
                                onClick={clearSearch}
                                className="text-xs underline hover:text-foreground"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </CardHeader>

                <Separator />

                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="animate-spin h-6 w-6" />
                        </div>
                    ) : isError ? (
                        <p className="text-center py-16 text-destructive">{`Error: ${error?.message}`}</p>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16">
                            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-muted-foreground">
                                {search ? "No activities found matching your search." : "No activities logged yet."}
                            </p>
                            {!search && (
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Start tracking your activities to see them here!
                                </p>
                            )}
                        </div>
                    ) : viewMode === "card" ? (
                        <div className="w-full flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                            {logs.map((log) => (
                                <Card key={log.id} className="w-full transition-colors hover:bg-muted/30">
                                    <CardHeader className="py-3">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="secondary" className="capitalize text-sm w-fit">
                                                        {log.category}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(log.startedAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {log.finishedAt && (
                                                        <span className="font-mono text-sm text-muted-foreground">
                                                            {duration(log.startedAt, log.finishedAt)}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 bg-gray-200 rounded-full"
                                                            onClick={() => setLogToEdit(log)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 bg-gray-200 rounded-full"
                                                            onClick={() => setLogToDelete(log)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            {log.description && (
                                                <DescriptionDisplay description={log.description} />
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    {new Date(log.startedAt).toLocaleTimeString()} - {log.finishedAt ? new Date(log.finishedAt).toLocaleTimeString() : 'N/A'}
                                                </span>
                                            </div>
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
                                        <TableHead>Activity</TableHead>
                                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="hidden sm:table-cell">Time</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize text-sm">
                                                    {log.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell max-w-[200px]">
                                                {log.description ? (
                                                    <DescriptionDisplay description={log.description} />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {formatDate(log.startedAt)}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                                                {new Date(log.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {log.finishedAt ? duration(log.startedAt, log.finishedAt) : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 bg-gray-200 rounded-full"
                                                        onClick={() => setLogToEdit(log)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 bg-gray-200 rounded-full"
                                                        onClick={() => setLogToDelete(log)}
                                                    >
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
                            <span className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={!!logToEdit} onOpenChange={() => setLogToEdit(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Activity</DialogTitle>
                        <DialogDescription>Edit activity details.</DialogDescription>
                    </DialogHeader>
                    {logToEdit && (
                        <form onSubmit={handleUpdateSubmit} className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Activity</Label>
                                <Input id="category" name="category" defaultValue={logToEdit.category} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                                <textarea
                                    id="description"
                                    name="description"
                                    defaultValue={logToEdit.description || ''}
                                    placeholder="Add description, notes, or URL..."
                                    className="col-span-3 min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="startedAt" className="text-right">Started At</Label>
                                <Input
                                    id="startedAt"
                                    name="startedAt"
                                    type="time"
                                    defaultValue={new Date(logToEdit.startedAt).toTimeString().slice(0, 5)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="finishedAt" className="text-right">Finished At</Label>
                                <Input
                                    id="finishedAt"
                                    name="finishedAt"
                                    type="time"
                                    defaultValue={logToEdit.finishedAt ? new Date(logToEdit.finishedAt).toTimeString().slice(0, 5) : ''}
                                    className="col-span-3"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateLogMutation.isPending}>
                                    {updateLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!logToDelete} onOpenChange={() => setLogToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the log for: <span className="font-semibold">{logToDelete?.category}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLogMutation.isPending}>
                            {deleteLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
