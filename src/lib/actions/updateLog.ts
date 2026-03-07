"use server"

import { Log } from "../types";
import { getSession } from "./getSession";
import prisma from "@/lib/db";
import { calculateDuration, validateTimeRange, isFutureDateTime } from "@/lib/domain";

export async function updateLog(data: Log) {
    const { user } = await getSession();
    if (!user) {
        throw new Error("User must be logged in to update the log")
    }

    if (isFutureDateTime(data.startedAt)) {
        throw new Error("Activity start time cannot be in the future")
    }
    if (data.finishedAt && isFutureDateTime(data.finishedAt)) {
        throw new Error("Activity end time cannot be in the future")
    }

    // Validate time range if both times are provided
    if (data.finishedAt && !validateTimeRange(data.startedAt, data.finishedAt)) {
        throw new Error("End time must be after start time")
    }

    // Calculate duration if finishedAt is provided
    const duration = data.finishedAt 
        ? calculateDuration(data.startedAt, data.finishedAt)
        : null

    const newTagIds = data.tagIds ?? undefined
    const previousLog = newTagIds !== undefined
        ? await prisma.log.findUnique({
            where: { id: data.id, userId: user.id },
            select: { tagIds: true }
        })
        : null
    const previousTagIds = previousLog?.tagIds ?? []

    const log = await prisma.log.update({
        where: { id: data.id },
        data: {
            description: data.description,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            duration,
            ...(newTagIds !== undefined ? { tagIds: newTagIds } : {})
        },
        include: {
            tags: true
        }
    })

    // Keep Tag.logIds in sync when tagIds changed
    if (newTagIds !== undefined) {
        const toAdd = newTagIds.filter((id) => !previousTagIds.includes(id))
        const toRemove = previousTagIds.filter((id) => !newTagIds.includes(id))
        for (const tagId of toAdd) {
            const tag = await prisma.tag.findUnique({
                where: { id: tagId, userId: user.id }
            })
            if (tag && !tag.logIds.includes(log.id)) {
                await prisma.tag.update({
                    where: { id: tagId },
                    data: { logIds: [...tag.logIds, log.id] }
                })
            }
        }
        for (const tagId of toRemove) {
            const tag = await prisma.tag.findUnique({
                where: { id: tagId, userId: user.id }
            })
            if (tag && tag.logIds.includes(log.id)) {
                await prisma.tag.update({
                    where: { id: tagId },
                    data: { logIds: tag.logIds.filter((lid) => lid !== log.id) }
                })
            }
        }
    }

    return log
}