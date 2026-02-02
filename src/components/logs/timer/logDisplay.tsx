"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFinishedLogs } from "@/lib/actions/getFinishedLogs"
import { updateLog } from "@/lib/actions/updateLog"
import { deleteLog } from "@/lib/actions/deleteLog"
import { Log, Sort } from "@/lib/types"
import { duration } from "@/lib/utils"
import { ArrowUpDown, CalendarFold, ExternalLink, List, Loader2, Pencil, TableIcon, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LogsDisplay() {
    const [sort, setSort] = useState<Sort>(Sort.desc);
    const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [logToEdit, setLogToEdit] = useState<Log | null>(null);
    const [logToDelete, setLogToDelete] = useState<Log | null>(null);

    const queryClient = useQueryClient();

    const getLogsQuery = useQuery<Log[], Error>({
        queryKey: ["logs", sort, date],
        queryFn: () => getFinishedLogs(sort, date),
    });

    const updateLogMutation = useMutation({
        mutationFn: async (updatedData: Log) => updateLog(updatedData),
        onSuccess: () => {
            toast.success("Log updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["logs", sort, date] });
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
            setLogToEdit(null);
        },
        onError: (error) => {
            toast.error(`Failed to update log: ${error.message}`);
        },
    });

    const deleteLogMutation = useMutation({
        mutationFn: async (logId: string) => deleteLog(logId),
        onSuccess: () => {
            toast.success("Log deleted successfully!");
            queryClient.invalidateQueries({ queryKey: ["logs", sort, date] });
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] });
            setLogToDelete(null);
        },
        onError: (error) => {
            toast.error(`Failed to delete log: ${error.message}`);
        },
    });

const handleUpdateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!logToEdit) return;

    const formData = new FormData(event.currentTarget);
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const startTimeString = formData.get("startedAt") as string;
    const finishTimeString = formData.get("finishedAt") as string;

    const newStartedAt = new Date(logToEdit.startedAt);
    if (startTimeString) {
        const [hours, minutes] = startTimeString.split(':').map(Number);
        newStartedAt.setHours(hours, minutes, 0, 0);
    }

    let newFinishedAt: Date | null = null;
    if (finishTimeString) {
        const baseDate = logToEdit.finishedAt ? new Date(logToEdit.finishedAt) : new Date(logToEdit.startedAt);
        const [hours, minutes] = finishTimeString.split(':').map(Number);
        baseDate.setHours(hours, minutes, 0, 0);
        newFinishedAt = baseDate;
    }

    if (newFinishedAt && newStartedAt.getTime() > newFinishedAt.getTime()) {
        newStartedAt.setDate(newStartedAt.getDate() - 1);
    }
    
    const updatedData = {
        id: logToEdit.id,
        category: category,
        description: description || null,
        startedAt: newStartedAt,
        finishedAt: newFinishedAt,
    };

    updateLogMutation.mutate(updatedData);
};

// Helper to extract URLs from text
const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    return text.match(urlRegex) || [];
};

// Helper to get domain from URL
const getDomain = (url: string): string => {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain.length > 20 ? domain.substring(0, 20) + '...' : domain;
    } catch {
        return url.length > 20 ? url.substring(0, 20) + '...' : url;
    }
};

// Component to render description with URLs
const DescriptionDisplay = ({ description }: { description: string }) => {
    const urls = extractUrls(description);
    
    if (urls.length === 0) {
        return <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>;
    }

    const textWithoutUrls = description.replace(/(https?:\/\/[^\s]+)/gi, '').trim();

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
    );
};

    const handleDeleteConfirm = () => {
        if (!logToDelete?.id) return;
        deleteLogMutation.mutate(logToDelete.id);
    };

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none sm:py-6 py-3">
            <CardHeader className="flex sm:flex-row flex-col justify-between items-center gap-3">
                <span className="text-xl">Your Daily Activities</span>
                <div className="flex items-center gap-4">
                    {getLogsQuery.data?.length !== 0 && (
                        <Card className="p-0">
                            <CardContent className="flex flex-row items-center justify-start p-1 h-9 ">
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
                        disabled={!getLogsQuery.data || getLogsQuery.data.length === 0}
                        className="p-2 rounded-md border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors shadow-sm"
                        onClick={() => setSort((val) => (val === Sort.desc ? Sort.asc : Sort.desc))}
                        aria-label={`Sort logs ${sort === Sort.desc ? "ascending" : "descending"}`}
                    >
                        <ArrowUpDown className="size-5 text-muted-foreground hover:text-primary" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="flex items-center gap-2 p-2 rounded-md border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors shadow-sm text-sm font-medium text-muted-foreground hover:text-primary"
                                aria-label="Select date"
                            >
                                <CalendarFold className="size-5" />
                                <span>{date.toDateString()}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-full p-2 bg-background border rounded-md shadow-lg">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    if (newDate) {
                                        setDate(new Date(newDate.setHours(0, 0, 0, 0)));
                                    } else {
                                        setDate(new Date());
                                    }
                                }}
                                className="rounded-md border-none"
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <Separator />
            <CardContent>
                {getLogsQuery.isLoading ? (
                    <div className="flex justify-center items-center py-9">
                        <Loader2 className="animate-spin" />
                    </div>
                ) : getLogsQuery.isError ? (
                    <p className="text-center py-9 text-destructive">{`Error: ${getLogsQuery.error.message}`}</p>
                ) : !getLogsQuery.data || getLogsQuery.data.length === 0 ? (
                    <p className="text-center py-9 text-muted-foreground">No activities found for this date.</p>
                ) : viewMode === "card" ? (
                    <div className="w-full flex flex-col gap-3 h-96 overflow-y-auto">
                        {getLogsQuery.data.map((log) => (
                            <Card key={log.id} className="w-full transition-colors">
                                <CardHeader>
                                    <div className="hidden sm:flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="capitalize text-base">{log.category}</Badge>
                                            {log.finishedAt && <span className="font-mono text-sm text-muted-foreground">{duration(log.startedAt, log.finishedAt)}</span>}
                                        </div>
                                        {log.description && (
                                            <DescriptionDisplay description={log.description} />
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">{log.startedAt.toLocaleString()}</span>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToEdit(log)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToDelete(log)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:hidden">
                                        <div className="flex justify-between">
                                            <Badge variant="secondary" className="capitalize text-base w-fit">{log.category}</Badge>
                                            <div className="flex items-center gap-1 self-end">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToEdit(log)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToDelete(log)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                        {log.description && (
                                            <DescriptionDisplay description={log.description} />
                                        )}
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>{log.startedAt.toLocaleString()}</span>
                                            {log.finishedAt && <span className="font-mono">{duration(log.startedAt, log.finishedAt)}</span>}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-y-auto h-96 w-full rounded-md border">
                        <Table className="w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Activity</TableHead>
                                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                                    <TableHead>Started at</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getLogsQuery.data.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell><Badge variant="secondary" className="capitalize text-sm">{log.category}</Badge></TableCell>
                                        <TableCell className="hidden sm:table-cell max-w-[200px]">
                                            {log.description ? (
                                                <DescriptionDisplay description={log.description} />
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{log.startedAt.toLocaleTimeString()}</TableCell>
                                        <TableCell>{log.finishedAt ? duration(log.startedAt, log.finishedAt) : "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToEdit(log)}><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 bg-gray-200 rounded-full" onClick={() => setLogToDelete(log)}><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            <Dialog open={!!logToEdit} onOpenChange={() => setLogToEdit(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Activity</DialogTitle>
                        <DialogDescription>Edit activity details. The date will be preserved.</DialogDescription>
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
                                    defaultValue={logToEdit.startedAt.toTimeString().slice(0, 5)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="finishedAt" className="text-right">Finished At</Label>
                                <Input
                                    id="finishedAt"
                                    name="finishedAt"
                                    type="time"
                                    defaultValue={logToEdit.finishedAt ? logToEdit.finishedAt.toTimeString().slice(0, 5) : ''}
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

            <Dialog open={!!logToDelete} onOpenChange={() => setLogToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the log for: <span className="font-semibold">{logToDelete?.category}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteLogMutation.isPending}>
                            {deleteLogMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}