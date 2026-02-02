"use server"

import { Log } from "../types";
import { getSession } from "./getSession";
import prisma from "@/lib/db";

export async function updateLog(data: Log) {
    const { user } = await getSession();
    if (!user) {
        throw new Error(`User must be logged in to update the log: ${user}`)
    }
    const userExists = await prisma.user.findUnique({
        where: {
            id: user.id
        }
    })
    if (!userExists) {
        throw new Error(`User not found: ${userExists}`)
    }
    const log = await prisma.log.update({
        where: { id: data.id },
        data: {
            category: data.category,
            description: data.description,
            startedAt: data.startedAt,
            finishedAt: data.finishedAt,
        }
    })
}