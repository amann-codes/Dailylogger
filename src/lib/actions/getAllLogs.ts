"use server"

import { getSession } from "@/lib/actions/getSession"
import prisma from "@/lib/db"
import { LogWithTags, Sort } from "../types"

type GetAllLogsParams = {
    sort?: Sort
    page?: number
    limit?: number
    search?: string
    tagId?: string
}

type GetAllLogsResponse = {
    logs: LogWithTags[]
    total: number
    page: number
    totalPages: number
}

export async function getAllLogs({
    sort = Sort.desc,
    page = 1,
    limit = 20,
    search = "",
    tagId
}: GetAllLogsParams = {}): Promise<GetAllLogsResponse> {
    try {
        const { user } = await getSession()
        if (!user) {
            throw new Error("User must be logged in to get logs")
        }

        const whereClause = {
            userId: user.id,
            finishedAt: { not: null },
            ...(search ? {
                description: { contains: search, mode: "insensitive" as const }
            } : {}),
            ...(tagId ? {
                tagIds: { has: tagId }
            } : {})
        }

        const [logs, total] = await Promise.all([
            prisma.log.findMany({
                where: whereClause,
                orderBy: {
                    startedAt: sort
                },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    tags: true
                }
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
