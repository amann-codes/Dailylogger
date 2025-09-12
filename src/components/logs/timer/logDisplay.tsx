"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFinishedLogs } from "@/lib/actions/getFinishedLogs"
import { Log, Sort } from "@/lib/types"
import { duration } from "@/lib/utils"
import { ArrowUpDown, CalendarFold, List, Loader2, TableIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DropdownMenuContent } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function LogsDisplay() {
    const [sort, setSort] = useState<Sort>(Sort.desc);
    const [date, setDate] = useState<Date>(new Date(new Date().setHours(0, 0, 0, 0)));
    const [viewMode, setViewMode] = useState<"table" | "card">("table");

    const getLogsQuery = useQuery<Log[], Error>({
        queryKey: ["logs", sort, date],
        queryFn: () => getFinishedLogs(sort, date),
    })

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none  sm:py-6 py-3">
            <CardHeader className="flex sm:flex-row flex-col justify-between items-center gap-3">
                <span className="text-xl">Your Daily Activities</span>
                <div className="flex items-center gap-4">
                    {getLogsQuery.data?.length !== 0 && <Card className="p-0">
                        <CardContent className="flex flex-row items-center justify-start p-1 h-9 ">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("card")}
                                className={`${viewMode == "card" ? "bg-gray-200" : ""}`}
                            >
                                <List className="h-4 w-4" />
                            </Button>

                            <Separator orientation="vertical" className="p-0 mx-1" />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className={`${viewMode == "table" ? "bg-gray-200" : ""}`}
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>}
                    <Button
                        disabled={getLogsQuery.data?.length == 0}
                        className="p-2 rounded-md border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors shadow-sm"
                        onClick={() => setSort((val) => (val === Sort.desc ? Sort.asc : Sort.desc))}
                        aria-label={`Sort logs ${sort === Sort.desc ? "ascending" : "descending"}`}
                    >
                        <ArrowUpDown className="size-5 text-muted-foreground hover:text-primary" />
                    </Button>
                    <DropdownMenu >
                        <DropdownMenuTrigger asChild>
                            <Button
                                className="flex items-center gap-2 p-2 rounded-md border border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors shadow-sm text-sm font-medium text-muted-foreground hover:text-primary"
                                aria-label="Select date"
                            >
                                <CalendarFold className="size-5" />
                                <span>{date.toDateString()}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-full p-2 bg-background border rounded-md shadow-lg">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(newDate) => {
                                    if (newDate) {
                                        const adjustedDate = new Date(newDate.setHours(0, 0, 0, 0));
                                        setDate(adjustedDate);
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
            <CardContent >
                {getLogsQuery.isLoading ? (
                    <Loader2 className="animate-spin w-full my-9" />
                ) : getLogsQuery.isError ? (
                    <p className="text-center">{`Error getting logs :${getLogsQuery.error}`}</p>
                ) : !getLogsQuery.data || getLogsQuery.data.length === 0 ? (
                    <p className="text-center">No activities, start the timer and log your activites</p>
                ) :
                    (viewMode == "card" ?
                        <div className="w-full flex flex-col gap-2 h-96 overflow-y-auto">
                            {getLogsQuery.data.map((log, index) => (
                                <Card
                                    key={index}
                                    className="w-full hover:bg-muted/30 transition-colors"
                                >
                                    <CardHeader>
                                        <div className="hidden sm:flex flex-col gap-5">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="secondary" className="capitalize text-base">
                                                    {log.category}
                                                </Badge>
                                                {log.finishedAt && (
                                                    <span className="font-mono text-sm text-muted-foreground">
                                                        {duration(log.startedAt, log.finishedAt) ?? "N/A"}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground ml-2">
                                                {log.startedAt.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 sm:hidden">
                                            <Badge variant="secondary" className="capitalize text-base">
                                                {log.category}
                                            </Badge>
                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                <span className="ml-2">{log.startedAt.toLocaleString()}</span>
                                                {log.finishedAt && (
                                                    <span className="font-mono">
                                                        {duration(log.startedAt, log.finishedAt) ?? "N/A"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                            ))}
                        </div>
                        :
                        <div className="overflow-y-auto h-96 w-full rounded-md border p-1">
                            <Table className="w-full">
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Activity</TableHead>
                                        <TableHead>Started at</TableHead>
                                        <TableHead>Duration</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getLogsQuery.data.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="capitalize text-sm"
                                                >
                                                    {log.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.startedAt.toLocaleTimeString()}
                                            </TableCell>
                                            {log.finishedAt && (
                                                <TableCell>
                                                    {duration(log.startedAt, log.finishedAt)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                    )
                }
            </CardContent>
        </Card>
    )
}
