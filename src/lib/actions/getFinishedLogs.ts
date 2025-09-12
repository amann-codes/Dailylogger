"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { Log, Sort } from "../types"

export async function getFinishedLogs(sort: Sort, date?: Date): Promise<Log[]> {
    try {
        console.log("date passed", date)
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }
        const userId = user.id
        const inputDate = date ? new Date(date) : new Date();
        const startDate = new Date(inputDate);
        const endDate = new Date(inputDate.getTime() + 24 * 60 * 60 * 1000);

        console.log("startDate:", startDate, "endDate:", endDate);

        const logs = await prisma.log.findMany({
            where: {
                AND: [
                    { userId },
                    { status: "Stopped" },
                    {
                        startedAt: {
                            gte: startDate,
                            lt: endDate,
                        },
                    },
                ]
            },
            orderBy: {
                startedAt: sort
            }
        })
        console.log("output with date", date, logs);
        return logs
    } catch (error) {
        throw new Error(`Error occurred while getting logs: ${error}`)
    }
}