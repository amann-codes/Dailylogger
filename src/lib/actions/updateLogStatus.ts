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
            status: "Running"
        },
    })
    if (!log) {
        return;
    }
    const update = await prisma.log.update({
        where: {
            id: log.id
        },
        data: {
            finishedAt:new Date(),
            status: "Stopped"
        }
    })
    console.log("log updated", update)
    if (!update) {
        throw new Error(`Activity was not udpated :${update}`)
    }
    return log;
}