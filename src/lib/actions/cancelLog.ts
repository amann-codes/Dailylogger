"use server"

import { getSession } from "./getSession"
import prisma from "../db";

export async function cancelLog() {
    const { user } = await getSession();
    const running = await prisma.log.findFirst({
        where:
        {
            AND: [
                { userId: user?.id },
                { status: "Running" }
            ]
        }
    })
    const deleteLog = await prisma.log.delete({
        where: {
            id: running?.id
        }
    })
    return deleteLog;
}