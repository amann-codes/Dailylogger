"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CreateLog } from "@/components/logs/createLogs"
import { LogsDisplay } from "@/components/logs/timer/logDisplay"
import { RecentActivities } from "@/components/logs/recentActivities"
import { createLog } from "@/lib/actions/createLog"
import getRunningLog from "@/lib/actions/getRunningLog"
import { udpateLogStatus } from "@/lib/actions/updateLogStatus"
import { getTags, createTag } from "@/lib/actions/tags"
import { toast } from "sonner"
import { Header } from "@/components/layout/header"
import { Tag } from "@/lib/types"

export default function ActivityPage() {
    const queryClient = useQueryClient()

    const getRunningLogQuery = useQuery({
        queryKey: ['running-log'],
        queryFn: getRunningLog
    })

    const tagsQuery = useQuery({
        queryKey: ['tags'],
        queryFn: getTags
    })

    const { mutate: createLogMutation, isPending: isCreating } = useMutation({
        mutationFn: createLog,
        onSuccess: () => {
            toast.success("Activity started")
            queryClient.invalidateQueries({ queryKey: ["running-log"] })
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to start activity")
        },
    })

    const { mutate: updateLogMutation, isPending: isUpdating } = useMutation({
        mutationFn: udpateLogStatus,
        onSuccess: () => {
            toast.success("Activity recorded")
            queryClient.invalidateQueries({ queryKey: ["logs"] })
            queryClient.invalidateQueries({ queryKey: ["recent-logs"] })
            queryClient.invalidateQueries({ queryKey: ["running-log"] })
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to stop activity")
        },
    })

    const handleCreateTag = async (name: string): Promise<Tag> => {
        const tag = await createTag(name)
        queryClient.invalidateQueries({ queryKey: ["tags"] })
        return tag
    }

    return (
        <div className="flex flex-col min-h-screen w-full sm:items-center sm:pt-8 pt-4 sm:space-y-4 space-y-2 pb-8 bg-gradient-to-br from-sky-50 via-slate-50 to-emerald-50">
            <Header />
            <CreateLog
                handleCreate={(description, tagIds) => createLogMutation({ description, tagIds })}
                handleUpdate={updateLogMutation}
                isCreating={isCreating}
                isUpdating={isUpdating}
                isFetchingRunningLog={getRunningLogQuery.isFetching}
                runningLog={getRunningLogQuery.data || null}
                tags={tagsQuery.data || []}
                onCreateTag={handleCreateTag}
            />
            <LogsDisplay />
            <RecentActivities />
        </div>
    )
}