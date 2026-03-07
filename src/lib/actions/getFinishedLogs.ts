"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { LogWithTags, Sort } from "../types"

/**
 * Get finished logs for a day. Uses dayStart/dayEnd from the client so the
 * same calendar day is used regardless of server timezone (fixes prod vs dev).
 */
export async function getFinishedLogs(
    sort: Sort,
    dayStartISO: string,
    dayEndISO: string
): Promise<LogWithTags[]> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }

        const dayStart = new Date(dayStartISO)
        const dayEnd = new Date(dayEndISO)

        const logs = await prisma.log.findMany({
            where: {
                userId: user.id,
                finishedAt: { not: null },
                startedAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            orderBy: {
                startedAt: sort
            },
            include: {
                tags: true
            }
        })

        return logs
    } catch (error) {
        throw new Error(`Error occurred while getting logs: ${error}`)
    }
}