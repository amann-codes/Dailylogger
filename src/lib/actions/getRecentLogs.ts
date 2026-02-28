"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { LogWithTags } from "../types"
import { daysAgo } from "@/lib/domain"

export async function getRecentLogs(): Promise<LogWithTags[]> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }

        const oneWeekAgo = daysAgo(7)

        const logs = await prisma.log.findMany({
            where: {
                userId: user.id,
                finishedAt: { not: null },
                startedAt: {
                    gte: oneWeekAgo,
                },
            },
            orderBy: {
                startedAt: "desc"
            },
            take: 20,
            include: {
                tags: true
            }
        })

        return logs
    } catch (error) {
        throw new Error(`Error occurred while getting recent logs: ${error}`)
    }
}
