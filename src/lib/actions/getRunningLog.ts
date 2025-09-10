"use server"

import { getSession } from "./getSession"
import prisma from "../db";
import { Log } from "../types";

export default async function getRunningLog(): Promise<Log | null> {
    const { user } = await getSession();
    if (!user) {
        throw new Error(`User must be logged in to get running clocks :${user}`)
    }
    const runningLog = await prisma.log.findFirst({
        where: {
            AND: [
                { userId: user.id },
                { status: "Running" }
            ]
        }
    })
    return runningLog;
}