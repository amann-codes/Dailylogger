"use server"

import { getSession } from "./getSession";
import prisma from "@/lib/db";

export async function deleteLog(id: string) {
    const { user } = await getSession();
    if (!user) {
        throw new Error(`User must be logged in to update the log: ${user}`)
    }
    const log = await prisma.log.findFirst({
        where: { id, userId: user.id },
        select: { id: true, tagIds: true }
    })
    if (!log) {
        throw new Error("Log not found or access denied")
    }
    for (const tagId of log.tagIds) {
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
    await prisma.log.delete({
        where: { id },
    })
}