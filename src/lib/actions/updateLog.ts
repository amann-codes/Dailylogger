"use server"

import { Log } from "../types";
import { getSession } from "./getSession";
import prisma from "@/lib/db";
import { calculateDuration, validateTimeRange } from "@/lib/domain";

export async function updateLog(data: Log) {
    const { user } = await getSession();
    if (!user) {
        throw new Error("User must be logged in to update the log")
    }

    // Validate time range if both times are provided
    if (data.finishedAt && !validateTimeRange(data.startedAt, data.finishedAt)) {
        throw new Error("End time must be after start time")
    }

    // Calculate duration if finishedAt is provided
    const duration = data.finishedAt 
        ? calculateDuration(data.startedAt, data.finishedAt)
        : null

    const log = await prisma.log.update({
        where: { id: data.id },
        data: {
            description: data.description,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
            duration,
            tagIds: data.tagIds || undefined
        },
        include: {
            tags: true
        }
    })

    return log
}