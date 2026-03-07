"use server"

import { getSession } from "./getSession"
import prisma from "../db"
import { calculateDuration } from "@/lib/domain"

/** Optional finished-at (ISO) from client so timestamp matches user's timezone. */
export const udpateLogStatus = async (finishedAtISO?: string) => {
    const { user } = await getSession();
    if (!user) {
        throw new Error("User must be logged in to update logs");
    }

    // Find running log (finishedAt === null)
    const log = await prisma.log.findFirst({
        where: {
            userId: user.id,
            finishedAt: null
        }
    })

    if (!log) {
        throw new Error("No running activity found to stop")
    }

    const finishedAt = finishedAtISO ? new Date(finishedAtISO) : new Date()
    const duration = calculateDuration(log.startedAt, finishedAt)

    const updatedLog = await prisma.log.update({
        where: {
            id: log.id
        },
        data: {
            finishedAt,
            duration
        },
        include: {
            tags: true
        }
    })

    if (!updatedLog) {
        throw new Error("Failed to stop activity")
    }

    return updatedLog
}