"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { LogWithTags } from "../types"

/** Since ISO is from the client so "last 7 days" uses the user's timezone. */
export async function getRecentLogs(sinceISO: string): Promise<LogWithTags[]> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }

        const since = new Date(sinceISO)

        const logs = await prisma.log.findMany({
            where: {
                userId: user.id,
                finishedAt: { not: null },
                startedAt: {
                    gte: since,
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
