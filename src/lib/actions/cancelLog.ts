"use server"

import { getSession } from "./getSession"
import prisma from "../db";

export async function cancelLog() {
    const { user } = await getSession();
    if (!user?.id) {
        throw new Error("User must be logged in");
    }
    
    const running = await prisma.log.findFirst({
        where: {
            userId: user.id,
            finishedAt: null
        }
    })
    
    if (!running) {
        throw new Error("No running log found");
    }
    
    const deleteLog = await prisma.log.delete({
        where: {
            id: running.id
        }
    })
    return deleteLog;
}