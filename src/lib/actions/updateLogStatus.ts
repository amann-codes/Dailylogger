"use server"

import { getSession } from "./getSession"
import prisma from "../db"

export const udpateLogStatus = async () => {
    const { user } = await getSession();
    if (!user) {
        throw new Error(`User must be logged in to update logs ${user}`);
    }
    const log = await prisma.log.findFirst({
        where: {
            AND: [
                { userId: user.id },
                { status: "Running" }
            ]
        }
    })
    if (!log) {
        throw new Error("No log found running to udpate")
    }
    const update = await prisma.log.update({
        where: {
            id: log.id
        },
        data: {
            finishedAt: new Date(),
            status: "Stopped"
        }
    })
    if (!update) {
        throw new Error(`Activity was not udpated :${update}`)
    }
    return log;
}