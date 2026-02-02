"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { Log } from "../types"

export async function getRecentLogs(): Promise<Log[]> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }
        const userId = user.id
        
        // Get logs from last 7 days to now
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        oneWeekAgo.setHours(0, 0, 0, 0)

        const logs = await prisma.log.findMany({
            where: {
                AND: [
                    { userId },
                    { status: "Stopped" },
                    {
                        startedAt: {
                            gte: oneWeekAgo,
                            lte: now,
                        },
                    },
                ]
            },
            orderBy: {
                startedAt: "desc"
            },
            take: 20 // Limit to 20 recent activities
        })
        return logs
    } catch (error) {
        throw new Error(`Error occurred while getting recent logs: ${error}`)
    }
}
