"use server"

import { getSession } from "@/lib/actions/getSession";
import prisma from "@/lib/db";
import { isRunning } from "@/lib/domain";

type CreateLogInput = {
    description?: string | null;
    tagIds?: string[];
    /** Start time (ISO) from client so timestamp matches user's timezone. */
    startedAtISO?: string;
}

export async function createLog(data: CreateLogInput) {
    try {
        const { user } = await getSession();
        const userId = user?.id;
        if (!userId) {
            throw new Error("User must be logged in to create logs")
        }

        // Enforce single running log - prevent starting a second activity
        const existingRunning = await prisma.log.findFirst({
            where: {
                userId,
                finishedAt: null
            }
        })

        if (existingRunning && isRunning(existingRunning.finishedAt)) {
            throw new Error("You already have a running activity. Stop it first before starting a new one.")
        }

        const startedAt = data.startedAtISO ? new Date(data.startedAtISO) : new Date()
        const log = await prisma.log.create({
            data: {
                description: data.description || null,
                startedAt,
                finishedAt: null,
                duration: null,
                userId,
                tagIds: data.tagIds || []
            },
            include: {
                tags: true
            }
        })

        if (!log) {
            throw new Error("Failed to create activity")
        }

        // Keep Tag.logIds in sync: add this log id to each tag's logIds
        const tagIds = data.tagIds || []
        for (const tagId of tagIds) {
            const tag = await prisma.tag.findUnique({
                where: { id: tagId, userId }
            })
            if (tag && !tag.logIds.includes(log.id)) {
                await prisma.tag.update({
                    where: { id: tagId },
                    data: { logIds: [...tag.logIds, log.id] }
                })
            }
        }

        return log
    } catch (error) {
        if (error instanceof Error) {
            throw error
        }
        throw new Error(`Error occurred while creating activity: ${error}`)
    }
}