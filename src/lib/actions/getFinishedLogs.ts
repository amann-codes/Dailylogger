"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { LogWithTags, Sort } from "../types"
import { startOfDay, endOfDay } from "@/lib/domain"

export async function getFinishedLogs(sort: Sort, date?: Date): Promise<LogWithTags[]> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }

        const inputDate = date ? new Date(date) : new Date()
        const dayStart = startOfDay(inputDate)
        const dayEnd = endOfDay(inputDate)

        const logs = await prisma.log.findMany({
            where: {
                userId: user.id,
                finishedAt: { not: null }, // Finished = finishedAt is not null
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