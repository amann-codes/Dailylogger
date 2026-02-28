"use server"

import { getSession } from "./getSession"
import prisma from "../db";
import { LogWithTags } from "../types";

export default async function getRunningLog(): Promise<LogWithTags | null> {
    const { user } = await getSession();
    if (!user) {
        throw new Error("User must be logged in to get running activity")
    }

    const runningLog = await prisma.log.findFirst({
        where: {
            userId: user.id,
            finishedAt: null // Running = finishedAt is null
        },
        include: {
            tags: true
        }
    })

    return runningLog;
}