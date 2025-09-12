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
    const [date, setDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<"table" | "card">("table");

    const getLogsQuery = useQuery<Log[], Error>({
        queryKey: ["logs", sort, date],
        queryFn: () => getFinishedLogs(sort, date),
    })

    return (
        <Card className="max-w-2xl w-full sm:rounded-xl rounded-none">
            <CardHeader className="flex sm:flex-row flex-col justify-between gap-3 ">
                <span >Your Daily Activities</span>
                <div className="flex items-center gap-4">
                    <Card className="p-0">
                        <CardContent className="flex flex-row items-center justify-start p-1 h-9 ">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("card")}
                            >
                                <List className="h-4 w-4" />
                            </Button>

                            <Separator orientation="vertical" className="p-0 m-0" />

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode("table")}
                            >
                                <TableIcon className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                    <Button
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
                                <Card key={index} className="w-full hover:bg-muted/30 transition-colors">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="secondary" className="capitalize text-base">
                                                {log.category}
                                            </Badge>
                                            <div className="flex gap-3 font-mono text-sm text-muted-foreground">
                                                <span className="hidden" >{log.startedAt.toLocaleString()},</span>
                                                {
                                                    log.finishedAt &&
                                                    <span>
                                                        {duration(log.startedAt, log.finishedAt) ?? "N/A"}
                                                    </span>
                                                }
                                            </div>
                                        </div>
                                        <span className="sm:hidden" >{log.startedAt.toLocaleString()},</span>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                        :
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Activity</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Duration</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    getLogsQuery.data.map((log, index) => {
                                        return <TableRow key={index}>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize text-sm">
                                                    {log.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.startedAt.toLocaleDateString()}</TableCell>
                                            {
                                                log.finishedAt && <TableCell>{
                                                    duration(log.startedAt, log.finishedAt)
                                                }</TableCell>}
                                        </TableRow>
                                    })
                                }
                            </TableBody>
                        </Table>
                    )
                }
            </CardContent>
        </Card>
    )
}
