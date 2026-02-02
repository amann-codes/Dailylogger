"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CreateLog } from "@/components/logs/createLogs"
import { LogsDisplay } from "@/components/logs/timer/logDisplay"
import { RecentActivities } from "@/components/logs/recentActivities"
import { createLog } from "@/lib/actions/createLog"
import getRunningLog from "@/lib/actions/getRunningLog"
import { udpateLogStatus } from "@/lib/actions/updateLogStatus"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"

export default function ActivityPage() {
    const queryClient = useQueryClient()

    const getRunningLogQuery = useQuery({
        queryKey: ['running clock'],
        queryFn: getRunningLog
    })

    const { mutate: createLogMutation, isPending: isCreating } = useMutation({
        mutationFn: createLog,
        onSuccess: () => {
            toast.success("Activity started successfully")
        },
        onError: (error) => {
            toast.error(`Failed to create log: ${error.message}`)
        },
    })

    const { mutate: updateLogMutation, isPending: isUpdating } = useMutation({
        mutationFn: udpateLogStatus,
        onSuccess: () => {
            toast.success("Activity recorded successfully")
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
        },
        onError: (error) => {
            toast.error(`Failed to update log: ${error.message}`)
        },
    })

    return (
        <div className="flex flex-col min-h-screen w-full sm:items-center sm:justify-center sm:space-y-4">
            <Header />
            <CreateLog
                handleCreate={(category, startedAt, description) => createLogMutation({ finishedAt: null, category, startedAt, description })}
                handleUpdate={updateLogMutation}
                isCreating={isCreating}
                isUpdating={isUpdating}
                isFetchingRunningLog={getRunningLogQuery.isFetching}
                runningLog={getRunningLogQuery.data || null}
            />
            <LogsDisplay />
            <RecentActivities />
        </div>
    )
}