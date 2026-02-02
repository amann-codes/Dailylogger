"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { Log, Sort } from "../types"

type GetAllLogsParams = {
    sort?: Sort
    page?: number
    limit?: number
    search?: string
}

type GetAllLogsResponse = {
    logs: Log[]
    total: number
    page: number
    totalPages: number
}

export async function getAllLogs({
    sort = Sort.desc,
    page = 1,
    limit = 20,
    search = ""
}: GetAllLogsParams = {}): Promise<GetAllLogsResponse> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }
        const userId = user.id

        const whereClause = {
            AND: [
                { userId },
                { status: "Stopped" as const },
                ...(search ? [{
                    OR: [
                        { category: { contains: search, mode: "insensitive" as const } },
                        { description: { contains: search, mode: "insensitive" as const } }
                    ]
                }] : [])
            ]
        }

        const [logs, total] = await Promise.all([
            prisma.log.findMany({
                where: whereClause,
                orderBy: {
                    startedAt: sort
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.log.count({
                where: whereClause
            })
        ])

        return {
            logs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }
    } catch (error) {
        throw new Error(`Error occurred while getting all logs: ${error}`)
    }
}
